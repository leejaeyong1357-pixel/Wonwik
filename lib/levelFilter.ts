import { gradeIndex } from "./scoring";
import type { Level, Difficulty } from "@/types";

/**
 * 목표 등급에 맞는 문항 난이도.
 * NL~NH 는 기초, IL~IM2 는 기초+중급, IM3 는 중급, IH~AL 은 중급+고급.
 */
export function difficultiesForLevel(target: Level): Difficulty[] {
  const i = gradeIndex(target);
  if (i <= 2) return ["easy"];            // NL, NM, NH
  if (i <= 5) return ["easy", "medium"];  // IL, IM1, IM2
  if (i === 6) return ["medium"];         // IM3
  return ["medium", "hard"];              // IH, AL
}

export function filterByTargetLevel<T extends { difficulty: Difficulty }>(
  items: T[],
  target: Level,
): T[] {
  const allowed = difficultiesForLevel(target);
  const filtered = items.filter((q) => allowed.includes(q.difficulty));
  return filtered.length > 0 ? filtered : items;
}

export function levelGuidance(target: Level): string {
  const i = gradeIndex(target);
  if (i <= 2) return "기본 어휘로 짧은 문장 완성하기";
  if (i <= 4) return "익숙한 주제를 3~4문장으로 이어 말하기";
  if (i === 5) return "구체적인 묘사와 이유 설명 붙이기";
  if (i === 6) return "문단 단위 답변 + 연결어로 논리 만들기";
  if (i === 7) return "돌발 상황 대처 + 다양한 시제·구문 활용";
  return "이슈 분석과 근거 제시로 심화 답변";
}
