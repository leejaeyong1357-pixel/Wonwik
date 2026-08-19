/**
 * ⚠️ 원익 환경 설정 — 운영 전 반드시 확인하세요.
 *
 * AI 채점에 사용할 게이트웨이 주소입니다.
 * 아래 기본값은 이전 프로젝트(현대차그룹 사내 HChat)의 주소이며,
 * 원익에서는 접근할 수 없습니다. 반드시 아래 중 하나로 교체해야 합니다.
 *
 *   1) 사내 AI 게이트웨이가 있는 경우
 *      → AI_BASE_URL 을 해당 주소로 변경
 *
 *   2) 상용 API(Anthropic 등)를 직접 사용하는 경우
 *      → AI_BASE_URL = "https://api.anthropic.com/v1"
 *        (이 경우 Cloudflare Tunnel 자체가 필요 없습니다)
 *
 * Cloudflare 환경변수 HCHAT_TUNNEL_URL 을 설정하면
 * /api/hchat 이 그 주소로 프록시합니다 (사내망 경유가 필요할 때만 사용).
 */
export const AI_BASE_URL = "https://CHANGE-ME.example.com/api/v3";

/** 하위 호환용 별칭 */
export const HCHAT_BASE_URL = AI_BASE_URL;

export const AVAILABLE_MODELS = [
  { value: "claude-sonnet-4-6", label: "claude-sonnet-4-6 (권장)", provider: "anthropic" },
  { value: "claude-haiku-4-5", label: "claude-haiku-4-5 (빠름)", provider: "anthropic" },
] as const;

export function endpointForModel(model: string): string {
  if (model.startsWith("claude")) return `${AI_BASE_URL}/claude`;
  return AI_BASE_URL;
}

export const APP_NAME = "SPEAKZEN";
export const APP_TAGLINE = "by WONIK";

/** 브랜드 표기 — 화면 문구에 사용 */
export const COMPANY_NAME = "원익";
export const COMPANY_GROUP = "원익그룹";
