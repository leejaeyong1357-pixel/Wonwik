import t1 from "@/data/opic_type1_self_intro.json";
import t2 from "@/data/opic_type2_survey.json";
import t3 from "@/data/opic_type3_unexpected.json";
import t4 from "@/data/opic_type4_roleplay.json";
import t5 from "@/data/opic_type5_advanced.json";
import mocks from "@/data/opic_mock_exams.json";
import type {
  Difficulty,
  OpicMockExam,
  OpicQuestion,
  OpicQuestionSet,
  QuestionType,
} from "@/types";

const SETS: Record<QuestionType, OpicQuestionSet> = {
  1: t1 as unknown as OpicQuestionSet,
  2: t2 as unknown as OpicQuestionSet,
  3: t3 as unknown as OpicQuestionSet,
  4: t4 as unknown as OpicQuestionSet,
  5: t5 as unknown as OpicQuestionSet,
};

export const QUESTION_TYPES: QuestionType[] = [1, 2, 3, 4, 5];

/** 유형별 표시 정보 — 화면 라벨과 설명의 단일 출처 */
export const TYPE_META: Record<
  QuestionType,
  { name: string; short: string; icon: string; description: string }
> = {
  1: {
    name: "자기소개",
    short: "Self-Intro",
    icon: "👋",
    description: "시험 첫 문항. 본인·직장·거주지·가족을 소개합니다",
  },
  2: {
    name: "설문 주제",
    short: "Survey",
    icon: "📋",
    description: "설문에서 고른 주제. 묘사 → 습관 → 경험 콤보로 이어집니다",
  },
  3: {
    name: "돌발 주제",
    short: "Unexpected",
    icon: "🎲",
    description: "설문에 없어도 나오는 공통 주제. 날씨·교통·은행 등",
  },
  4: {
    name: "롤플레이",
    short: "Role Play",
    icon: "🎭",
    description: "상황을 주고 질문하기 · 문제 해결을 요구합니다",
  },
  5: {
    name: "고난도",
    short: "Advanced",
    icon: "🔥",
    description: "IH·AL 목표 구간. 비교와 이슈를 논리적으로 풀어냅니다",
  },
};

export function getQuestionSet(type: QuestionType): OpicQuestionSet {
  return SETS[type];
}

export function getQuestions(type: QuestionType): OpicQuestion[] {
  return SETS[type].questions;
}

export function getAllQuestions(): OpicQuestion[] {
  return QUESTION_TYPES.flatMap((t) => SETS[t].questions);
}

export function findQuestion(id: string): OpicQuestion | undefined {
  for (const t of QUESTION_TYPES) {
    const found = SETS[t].questions.find((q) => q.id === id);
    if (found) return found;
  }
  return undefined;
}

export function filterByDifficulty(
  type: QuestionType,
  difficulty: Difficulty,
): OpicQuestion[] {
  const all = getQuestions(type);
  const matched = all.filter((q) => q.difficulty === difficulty);
  // 해당 난이도 문항이 부족하면 전체에서 채운다 (빈 화면 방지)
  return matched.length >= 3 ? matched : all;
}

export function getCategories(type: QuestionType): string[] {
  return Array.from(new Set(getQuestions(type).map((q) => q.category)));
}

export function getMockExams(): OpicMockExam[] {
  return (mocks as unknown as { exams: OpicMockExam[] }).exams;
}

export function findMockExam(id: string): OpicMockExam | undefined {
  return getMockExams().find((e) => e.id === id);
}

/** 모의고사에 담긴 문항을 시험 순서대로 반환 */
export function getMockQuestions(exam: OpicMockExam): OpicQuestion[] {
  return exam.questionIds
    .map((id) => findQuestion(id))
    .filter((q): q is OpicQuestion => !!q);
}
