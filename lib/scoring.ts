import type { Level } from "@/types";

export const LEVEL_RANGES: Record<Level, [number, number]> = {
  1: [0, 15],
  2: [16, 24],
  3: [25, 34],
  4: [35, 49],
  5: [50, 64],
  6: [65, 74],
  7: [75, 84],
  8: [85, 96],
};

export function scoreToLevel(score: number): Level {
  for (const [lv, [min, max]] of Object.entries(LEVEL_RANGES)) {
    if (score >= min && score <= max) return Number(lv) as Level;
  }
  return score >= 96 ? 8 : 1;
}

export function levelLabel(level: Level): string {
  const [min, max] = LEVEL_RANGES[level];
  return `Lv ${level} (${min}~${max}점)`;
}

export function levelDescription(level: Level): string {
  const descs: Record<Level, string> = {
    1: "기초 입문 단계",
    2: "기본 의사소통 시작",
    3: "단순 일상 표현 가능",
    4: "기본 비즈니스 표현 시작",
    5: "기본 비즈니스 의사소통 가능",
    6: "업무 일상 영어 가능 (해외 주재원 최소 기준)",
    7: "유창한 업무 영어 (승진 우대 기준)",
    8: "원어민에 가까운 비즈니스 영어",
  };
  return descs[level];
}

export function getDaysUntil(dateStr: string): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function recommendedDifficulty(targetLevel: Level): "easy" | "medium" | "hard" {
  if (targetLevel <= 4) return "easy";
  if (targetLevel <= 6) return "medium";
  return "hard";
}
