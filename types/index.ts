/** OPIc 공식 9등급 (ACTFL 기준). 낮은 등급 → 높은 등급 순서 */
export const OPIC_GRADES = [
  "NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL",
] as const;

export type Level = (typeof OPIC_GRADES)[number];

/** OPIc 문항 유형 — 1 자기소개 / 2 설문 / 3 돌발 / 4 롤플레이 / 5 고난도 */
export type QuestionType = 1 | 2 | 3 | 4 | 5;

export type Difficulty = "easy" | "medium" | "hard";

export interface UserSession {
  name: string;
  employeeId: string;
  rrnFront: string;
  team?: string;
  position?: string;
  loggedInAt: number;
  isAdmin?: boolean;
}

export interface FlameState {
  level: number;
  streak: number;
  lastStudyDay: string;
  color: string;
}

export interface UserSettings {
  examDate: string;
  targetLevel: Level;
  currentLevel?: Level;
  aiModel?: string;
  setupCompleted: boolean;
  onboardingSeen?: boolean;
  onboardingSkipForever?: boolean;
  noticesAccepted?: boolean;
  flame?: FlameState;
}

export interface StudyRecord {
  id: string;
  questionId: string;
  type: QuestionType;
  userAnswer: string;
  feedback?: AiFeedback;
  score?: number;
  bookmarked: boolean;
  noteText?: string;
  createdAt: number;
}

/**
 * OPIc 평가 영역.
 *
 * OPIc 공식 등급은 총점 합산이 아니라 ACTFL 기준의 종합 판정이다.
 * 다만 학습자가 약점을 파악할 수 있어야 하므로, 이 앱에서는 5개 영역을
 * 각 20점으로 환산해 100점 만점으로 보여주고 그 총점을 등급 구간에 매핑한다.
 */
export interface ScoreCriteria {
  /** 과제 수행 — 질문 의도에 맞게 답했는가 */
  taskCompletion: number;
  /** 유창성 — 발화량·속도·끊김 */
  fluency: number;
  /** 어휘력 — 표현의 다양성과 정확성 */
  vocabulary: number;
  /** 문장 구성 — 문법 정확도와 문장 확장 */
  grammar: number;
  /** 전달력 — 발음·강세·명료도 */
  delivery: number;
}

export const CRITERIA_MAX = {
  taskCompletion: 20,
  fluency: 20,
  vocabulary: 20,
  grammar: 20,
  delivery: 20,
} as const;

export const CRITERIA_LABEL: Record<CriteriaKey, string> = {
  taskCompletion: "과제 수행",
  fluency: "유창성",
  vocabulary: "어휘력",
  grammar: "문장 구성",
  delivery: "전달력",
};

export type CriteriaKey = keyof ScoreCriteria;

/** 영역별(과제수행·유창성·어휘·문장구성·전달력) 세부 분석 */
export interface AreaAnalysis {
  summary: string;
  strengths: string[];
  improvements: string[];
}

/** 세부 피드백 항목 — 영역별 탭에 노출 */
export interface DetailTip {
  area: CriteriaKey;
  label: string;
  text: string;
  example?: string;
}

/** 고급 어휘·표현 제안 그룹 */
export interface VocabGroup {
  title: string;
  items: string[];
}

/** 추천 학습 액션 (진행률 표시용) */
export interface LearningAction {
  label: string;
  target: number;
  unit: string;
}

/** 발화 내용 구성 비율 */
export interface ContentSlice {
  label: string;
  percent: number;
}

/** 클라이언트에서 계산하는 발화 지표 (AI 호출 없이 측정 가능한 값) */
export interface SpeakingMetrics {
  responseSec?: number;
  speakingSec?: number;
  wordCount: number;
  sentenceCount: number;
  repeatedWords: number;
}

export interface AiFeedback {
  grammarIssues: string[];
  vocabularySuggestions: string[];
  betterExpressions: string[];
  modelAnswer: string;
  estimatedLevel: Level;
  scoreEstimate: number;
  strengths: string[];
  improvements: string[];
  criteria?: ScoreCriteria;

  // ── 확장 리포트용 필드 (AI 응답에 없으면 로컬 폴백으로 채움) ──
  summaryComment?: string;
  overallComment?: string;
  areas?: Partial<Record<CriteriaKey, AreaAnalysis>>;
  detailTips?: DetailTip[];
  vocabularyGroups?: VocabGroup[];
  learningActions?: LearningAction[];
  contentBreakdown?: ContentSlice[];
  topicRelevance?: number;
  confidence?: number;
}

export interface VocabEntry {
  word: string;
  meaning: string;
  example: string;
  source: string;
  addedAt: number;
}

export interface MockExamAnswer {
  questionId: string;
  type: QuestionType;
  answer: string;
  feedback?: AiFeedback;
}

export interface MockExamResult {
  examId: string;
  startedAt: number;
  finishedAt: number;
  /** 실제 OPIc 과 동일하게 문항 수가 가변이라 배열로 보관 */
  answers: MockExamAnswer[];
  totalScore: number;
  estimatedLevel: Level;
}

export interface LearnerProfile {
  name: string;
  employeeId: string;
  team: string;
  position: string;
  targetLevel: Level;
  examDate: string;
  startedAt: number;
  lastActiveAt: number;
  totalStudyMinutes: number;
  totalProblems: number;
  averageScore: number;
  recentScore: number;
  estimatedLevel: Level;
  mockExamCount: number;
}

export interface OpicQuestion {
  id: string;
  type: QuestionType;
  category: string;
  difficulty: Difficulty;
  question: string;
  /** 콤보 단계 — 묘사 / 습관 / 경험 / 비교 / 이슈 / 질문하기 / 문제해결 */
  combo?: string;
  /** 롤플레이에서 주어지는 한국어 상황 설명 */
  situation?: string;
  follow_ups: string[];
  keywords: string[];
  sample_answer: string;
}

export interface OpicQuestionSet {
  type: QuestionType;
  name: string;
  description: string;
  total: number;
  questions: OpicQuestion[];
}

export interface OpicMockExam {
  id: string;
  title: string;
  difficulty: Difficulty;
  targetGrade: Level;
  description: string;
  /** 실제 시험 순서대로 나열된 문항 id */
  questionIds: string[];
}
