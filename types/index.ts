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
  /** 마이페이지에서 모델을 직접 고른 경우 true. 기본값 변경이 덮어쓰지 않는다 */
  aiModelPinned?: boolean;
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
 * OPIc 공식 평가 영역 5가지.
 *
 * 실제 OPIc 은 이 5개 축을 종합해 ACTFL 등급을 판정하며 점수를 산출하지 않는다.
 * 이 앱은 학습자가 약점을 짚을 수 있도록 각 영역을 20점으로 환산해 보여주지만,
 * 화면에서는 어디까지나 등급이 주인공이고 점수는 보조 지표다.
 */
export interface ScoreCriteria {
  /** Language Control — 문법·어휘·유창성·발음의 정확도 */
  languageControl: number;
  /** Function / Global Tasks — 일관되고 즉흥적으로 언어 과제를 수행하는 능력 */
  functionTasks: number;
  /** Text Type — 발화의 길이와 구성 (단어 → 구 → 문장 → 접합 문장 → 문단) */
  textType: number;
  /** Contents / Context — 주제와 상황에 맞는 표현 능력 */
  contentsContext: number;
  /** Comprehensibility — 질문 의도를 제대로 파악했는가 */
  comprehensibility: number;
}

export const CRITERIA_MAX = {
  languageControl: 20,
  functionTasks: 20,
  textType: 20,
  contentsContext: 20,
  comprehensibility: 20,
} as const;

export const CRITERIA_LABEL: Record<CriteriaKey, string> = {
  languageControl: "Language Control",
  functionTasks: "Function / Global Tasks",
  textType: "Text Type",
  contentsContext: "Contents / Context",
  comprehensibility: "Comprehensibility",
};

export const CRITERIA_KO: Record<CriteriaKey, string> = {
  languageControl: "언어 정확도",
  functionTasks: "과제 수행력",
  textType: "발화 구성력",
  contentsContext: "내용 표현력",
  comprehensibility: "질문 이해도",
};

export const CRITERIA_DESC: Record<CriteriaKey, string> = {
  languageControl: "문법 · 어휘 · 유창성 · 발음",
  functionTasks: "일관되고 꾸준하게, 즉흥적으로 대처하는 능력",
  textType: "단어 → 구 → 문장 → 접합된 문장 → 문단",
  contentsContext: "주제와 상황에 대한 표현 능력",
  comprehensibility: "질문 의도를 제대로 이해했는가",
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

/** 학습자가 실제로 말한 문장에 대한 교정 */
export interface Correction {
  /** 학습자 답변에서 그대로 인용한 부분 */
  original: string;
  /** 고친 문장 */
  corrected: string;
  /** 무엇이 왜 틀렸는지 (한국어) */
  issue: string;
  /** 관련 문법 항목 (예: 시제 일치, 관사) */
  rule?: string;
}

/** 틀리지는 않았지만 더 높은 등급으로 들리게 만드는 표현 교체 */
export interface Upgrade {
  /** 학습자가 쓴 표현 */
  original: string;
  /** 대체 표현 */
  better: string;
  /** 왜 더 나은지 (한국어) */
  why: string;
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
  /** 이 등급으로 판정한 근거 (OPIc 레벨 기술서 기준) */
  gradeReason?: string;
  /** 다음 등급으로 올라가려면 무엇이 필요한지 */
  toNextGrade?: string[];
  /** 답변 원문을 인용한 문법 교정 */
  corrections?: Correction[];
  /** 답변 원문을 인용한 표현 업그레이드 */
  upgrades?: Upgrade[];
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
