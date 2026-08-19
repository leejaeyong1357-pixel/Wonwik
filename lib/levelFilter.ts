import type { Level, Difficulty } from "@/types";

export function difficultiesForLevel(target: Level): Difficulty[] {
  if (target <= 3) return ["easy"];
  if (target <= 5) return ["easy", "medium"];
  if (target === 6) return ["medium"];
  return ["medium", "hard"];
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
  if (target <= 3) return "기초 어휘와 단순 표현 위주";
  if (target <= 5) return "기본 비즈니스 표현 + 일반 주제";
  if (target === 6) return "비즈니스 회화 + 의견 표현";
  if (target === 7) return "고급 어휘 + 복합 문장 구조";
  return "원어민 수준 표현 + 전문 어휘";
}
