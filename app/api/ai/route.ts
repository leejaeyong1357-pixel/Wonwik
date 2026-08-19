import { NextResponse } from "next/server";
import { getOptionalRequestContext } from "@cloudflare/next-on-pages";
import { DEFAULT_MODEL, isAllowedModel } from "@/lib/constants";

export const runtime = "edge";

/**
 * Anthropic Messages API 프록시.
 *
 * 공식 SDK(@anthropic-ai/sdk) 는 내부적으로 node:fs / node:path 를 참조해
 * Next.js Edge 런타임에서 번들되지 않는다. Cloudflare Pages 는 Edge 런타임이 필수이므로
 * 여기서는 raw fetch 로 직접 호출한다. 프롬프트 캐싱은 요청 본문 필드라 동일하게 동작한다.
 */
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

interface ProxyRequest {
  system?: string;
  cacheSystem?: boolean;
  messages: { role: string; content: string }[];
  maxTokens?: number;
  model?: string;
  /** 추론 깊이. 채점처럼 루브릭이 명확한 작업은 낮출수록 응답이 빨라진다 */
  effort?: "low" | "medium" | "high";
}

/**
 * API 키는 서버에만 존재한다.
 * Cloudflare Pages → Settings → Variables and Secrets 에
 * ANTHROPIC_API_KEY 를 **Secret** 타입으로 등록할 것.
 */
function getApiKey(): string | null {
  const ctx = getOptionalRequestContext();
  const fromCf = (ctx?.env as any)?.ANTHROPIC_API_KEY as string | undefined;
  return fromCf || process.env.ANTHROPIC_API_KEY || null;
}

export async function POST(req: Request) {
  let body: ProxyRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식입니다" });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error:
        "AI 서버 키가 설정되지 않았습니다. 관리자에게 문의해주세요. (ANTHROPIC_API_KEY 미설정)",
    });
  }

  const { system, cacheSystem, messages, maxTokens = 2000, effort } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ ok: false, error: "messages 가 비어 있습니다" });
  }

  // 클라이언트가 임의 모델을 지정해 비용을 키우지 못하도록 화이트리스트로 제한
  const model = isAllowedModel(body.model) ? body.model! : DEFAULT_MODEL;

  const payload: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    // Claude Opus 5 는 thinking 이 기본으로 켜져 있어, 루브릭이 고정된 채점에서는
    // 추론 깊이를 낮추는 것만으로 체감 응답 시간이 크게 줄어든다.
    output_config: { effort: effort === "high" || effort === "medium" ? effort : "low" },
    messages: messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content })),
  };

  if (system) {
    // 채점 루브릭처럼 매 요청 동일한 긴 지시문은 캐시해 입력 비용을 크게 줄인다.
    // (캐시는 접두사 일치이므로 system 에 요청별 값이 들어가면 매번 캐시가 깨진다)
    payload.system = cacheSystem
      ? [{ type: "text", text: system, cache_control: { type: "ephemeral" } }]
      : system;
  }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await res.text();
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        status: res.status,
        error: describeError(res.status, data),
      });
    }

    // 안전상의 이유로 응답이 거절된 경우 — content 를 읽기 전에 확인
    if (data.stop_reason === "refusal") {
      return NextResponse.json({
        ok: false,
        error: "AI 가 이 요청에 대한 응답을 거절했습니다. 답변 내용을 확인해주세요.",
      });
    }

    const content = (data.content || [])
      .filter((b: any) => b?.type === "text")
      .map((b: any) => b.text)
      .join("");

    return NextResponse.json({
      ok: true,
      content,
      model: data.model,
      usage: {
        input: data.usage?.input_tokens ?? 0,
        output: data.usage?.output_tokens ?? 0,
        cacheRead: data.usage?.cache_read_input_tokens ?? 0,
        cacheWrite: data.usage?.cache_creation_input_tokens ?? 0,
      },
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: `네트워크 오류: ${e?.message || "unknown"}`,
    });
  }
}

/** HTTP 상태코드별로 사용자가 바로 조치할 수 있는 안내 문구 */
function describeError(status: number, data: any): string {
  const detail = data?.error?.message || data?.raw || "";
  switch (status) {
    case 401:
      return "AI 서버 인증 실패 — API 키가 올바르지 않습니다. 관리자에게 문의해주세요.";
    case 403:
      return "AI 서버 접근이 거부되었습니다. API 키 권한을 확인해주세요.";
    case 429:
      return "요청이 많아 잠시 대기가 필요합니다. 30초 후 다시 시도해주세요.";
    case 400:
      return `요청 오류: ${detail}`;
    default:
      if (status >= 500) {
        return "AI 서버가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.";
      }
      return `AI 서버 오류 (${status}): ${detail}`;
  }
}
