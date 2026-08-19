/**
 * AI 설정 — Anthropic Claude API 를 직접 사용한다.
 *
 * API 키는 서버(Cloudflare Pages 환경변수 ANTHROPIC_API_KEY, Secret 타입)에만 두며
 * 클라이언트로 내려보내지 않는다. 사용자가 개인 키를 발급받을 필요가 없다.
 *
 * 사내 게이트웨이를 경유하지 않으므로 Cloudflare Tunnel 및 24시간 상시 PC 가 필요 없다.
 */

/** 기본 채점 모델 */
export const DEFAULT_MODEL = "claude-opus-5";

export const AVAILABLE_MODELS = [
  { value: "claude-opus-5", label: "Claude Opus 5 (기본 · 가장 정확)" },
  { value: "claude-sonnet-5", label: "Claude Sonnet 5 (빠르고 저렴)" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5 (가장 저렴)" },
] as const;

const ALLOWED = new Set<string>(AVAILABLE_MODELS.map((m) => m.value));

/** 클라이언트가 임의 모델을 지정해 비용을 키우지 못하도록 검증 */
export function isAllowedModel(model?: string): boolean {
  return !!model && ALLOWED.has(model);
}

export const APP_NAME = "Wonpic";
export const APP_TAGLINE = "by WONIK";

/** 브랜드 표기 — 화면 문구에 사용 */
export const COMPANY_NAME = "원익";
export const COMPANY_GROUP = "원익그룹";
