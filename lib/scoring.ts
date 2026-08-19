import { OPIC_GRADES } from "@/types";
import type { Level } from "@/types";

/**
 * OPIc 등급 구간.
 *
 * 실제 OPIc 은 총점을 매기지 않고 ACTFL 기준으로 종합 판정한다.
 * 이 앱은 학습자가 진척을 체감할 수 있도록 5개 영역 100점 환산 점수를
 * 아래 구간에 매핑해 예상 등급을 보여준다. (공식 점수가 아님)
 */
export const GRADE_RANGES: Record<Level, [number, number]> = {
  NL: [0, 14],
  NM: [15, 24],
  NH: [25, 34],
  IL: [35, 44],
  IM1: [45, 54],
  IM2: [55, 64],
  IM3: [65, 74],
  IH: [75, 87],
  AL: [88, 100],
};

/** 하위 호환 별칭 — 기존 코드가 LEVEL_RANGES 로 참조 */
export const LEVEL_RANGES = GRADE_RANGES;

export function scoreToLevel(score: number): Level {
  for (const g of OPIC_GRADES) {
    const [min, max] = GRADE_RANGES[g];
    if (score >= min && score <= max) return g;
  }
  return score > 100 ? "AL" : "NL";
}

/** 등급의 순서값 (NL = 0 … AL = 8). 비교·정렬용 */
export function gradeIndex(level: Level): number {
  const i = OPIC_GRADES.indexOf(level);
  return i < 0 ? 0 : i;
}

/** a 가 b 이상인가 */
export function gradeAtLeast(a: Level, b: Level): boolean {
  return gradeIndex(a) >= gradeIndex(b);
}

/** 한 단계 위 등급 (최상위면 그대로) */
export function nextGrade(level: Level): Level {
  const i = gradeIndex(level);
  return OPIC_GRADES[Math.min(OPIC_GRADES.length - 1, i + 1)];
}

export function levelLabel(level: Level): string {
  return `${level} (${GRADE_NAMES[level]})`;
}

export const GRADE_NAMES: Record<Level, string> = {
  NL: "Novice Low",
  NM: "Novice Mid",
  NH: "Novice High",
  IL: "Intermediate Low",
  IM1: "Intermediate Mid 1",
  IM2: "Intermediate Mid 2",
  IM3: "Intermediate Mid 3",
  IH: "Intermediate High",
  AL: "Advanced Low",
};

export function levelDescription(level: Level): string {
  const descs: Record<Level, string> = {
    NL: "단어 나열 수준. 완전한 문장을 만들기 어려운 단계",
    NM: "암기한 짧은 문장으로 기본 정보를 전달하는 단계",
    NH: "익숙한 주제에 대해 간단한 문장을 만들 수 있는 단계",
    IL: "익숙한 주제를 문장으로 이어서 말할 수 있는 단계",
    IM1: "다양한 주제에 대해 문단 수준으로 답변하는 단계",
    IM2: "구체적인 묘사와 설명이 가능하고 흐름이 자연스러운 단계",
    IM3: "복잡한 주제도 논리적으로 풀어내는 단계 (사무직 일반 기준)",
    IH: "돌발 상황에도 유연하게 대처하고 다양한 문법을 구사하는 단계",
    AL: "전문 주제를 깊이 있게 논의할 수 있는 최상위 단계",
  };
  return descs[level];
}

/** 사내 활용 기준 안내 문구 */
export function levelUsage(level: Level): string {
  const usage: Record<Level, string> = {
    NL: "기초 학습 시작 구간",
    NM: "기초 학습 구간",
    NH: "기본 회화 준비 구간",
    IL: "일반 지원 최소 구간",
    IM1: "기술직 일반 요구 구간",
    IM2: "사무직 지원 최소 구간",
    IM3: "사무직 일반 요구 구간",
    IH: "주요 기업·공공기관 선호 구간",
    AL: "해외 업무·주재원 지원 구간",
  };
  return usage[level];
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
  const i = gradeIndex(targetLevel);
  if (i <= 3) return "easy";      // NL ~ IL
  if (i <= 6) return "medium";    // IM1 ~ IM3
  return "hard";                  // IH, AL
}

/** 목표 등급에서 주력해야 할 문항 유형 */
export function recommendedTypes(targetLevel: Level): number[] {
  const i = gradeIndex(targetLevel);
  if (i <= 3) return [1, 2];
  if (i <= 6) return [1, 2, 3, 4];
  return [2, 3, 4, 5];
}
