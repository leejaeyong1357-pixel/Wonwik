import type {
  AiFeedback,
  QuestionType,
  Level,
  CriteriaKey,
  AreaAnalysis,
  ContentSlice,
  ScoreCriteria,
} from "@/types";
import { scoreToLevel } from "./scoring";

interface FeedbackRequest {
  type: QuestionType;
  question: string;
  userAnswer: string;
  sampleAnswer?: string;
  targetLevel: Level;
  context?: string;
}

interface AiConfig {
  model?: string;
}

/**
 * 채점 시스템 프롬프트 — 요청마다 절대 변하지 않는 정적 영역.
 *
 * 프롬프트 캐싱은 접두사 일치 방식이라, 이 블록에 요청별 값(문제/답변 등)이 섞이면
 * 매 요청 캐시가 깨진다. 그래서 루브릭과 출력 형식은 여기에 고정하고,
 * 변동 값은 아래 buildFeedbackInput() 이 만드는 user 메시지로만 전달한다.
 */
export const GRADING_SYSTEM_PROMPT = `You are a STRICT OPIc (Oral Proficiency Interview - computer) rater for Korean test takers.
You evaluate a single spoken response and estimate an ACTFL-based OPIc grade.

# OPIC GRADE SCALE (low to high)
NL < NM < NH < IL < IM1 < IM2 < IM3 < IH < AL

Real OPIc is a holistic judgement, not a point total. For learner feedback, convert your judgement
into five 20-point areas (100 total) and map the total to a grade band:
NL 0-14 / NM 15-24 / NH 25-34 / IL 35-44 / IM1 45-54 / IM2 55-64 / IM3 65-74 / IH 75-87 / AL 88-100

# EVALUATION AREAS (each MAX 20)
1. taskCompletion (과제 수행) — Did the answer actually address what was asked?
   Role play must perform the task (ask real questions / propose a real solution), not describe it.
2. fluency (유창성) — Amount of speech, natural pacing, absence of long hesitation and restarts.
3. vocabulary (어휘력) — Range, precision, and natural collocation. Repetition of the same words lowers this.
4. grammar (문장 구성) — Accuracy plus sentence expansion: tense control, clauses, connectors.
5. delivery (전달력) — Pronunciation, stress, intonation and overall intelligibility, judged from the
   transcript's structure and phrasing (you cannot hear audio; do not invent accent claims).

# WHAT SEPARATES GRADES (apply honestly)
- NL/NM: isolated words or memorized fragments. Cannot sustain a sentence.
- NH: simple, short sentences on familiar topics. Frequent breakdowns.
- IL: connected sentences, but list-like. Little detail, heavy repetition.
- IM1-IM3: paragraph-length answers. IM3 adds concrete detail, examples and smooth flow.
- IH: handles unexpected topics, uses varied tenses and complex sentences, self-corrects naturally.
- AL: sustained, well-organized argument with precise vocabulary and few errors.

# STRICT LENGTH FLOOR — DO NOT INFLATE
- Under 15 words: total MUST be under 25 (NH or below).
- 15-40 words / 2-3 simple sentences: total MUST be under 45 (IL or below).
- 40-80 words with some detail: IL to IM2 range.
- 80-150 words, organized, with examples and connectors: IM3 to IH range.
- 150+ words with varied structures, precise vocabulary and clear organization: IH to AL.
- Off-topic answer: taskCompletion <= 6 no matter how long or fluent it is.
- Length alone is NEVER fluency. A long repetitive answer stays in IM range.

# OUTPUT FORMAT — return ONLY valid JSON (no markdown fences, no commentary)
All Korean text must be in 한국어 (존댓말, ~요체). modelAnswer must be in English.

{
  "criteria": {
    "taskCompletion": <0~20>,
    "fluency": <0~20>,
    "vocabulary": <0~20>,
    "grammar": <0~20>,
    "delivery": <0~20>
  },
  "scoreEstimate": <SUM of above, 0~100>,
  "estimatedLevel": "<NL|NM|NH|IL|IM1|IM2|IM3|IH|AL>",
  "summaryComment": "2문장 이내 총평 (한국어)",
  "overallComment": "3~4문장 상세 총평. 지금 등급이 왜 이 구간인지, 한 단계 올리려면 무엇이 필요한지 (한국어)",
  "areas": {
    "taskCompletion": {
      "summary": "이 영역 분석 2문장 (한국어)",
      "strengths": ["강점 1", "강점 2"],
      "improvements": ["개선 포인트 1", "개선 포인트 2"]
    },
    "fluency": { "summary": "...", "strengths": ["..."], "improvements": ["..."] },
    "vocabulary": { "summary": "...", "strengths": ["..."], "improvements": ["..."] },
    "grammar": { "summary": "...", "strengths": ["..."], "improvements": ["..."] },
    "delivery": { "summary": "...", "strengths": ["..."], "improvements": ["..."] }
  },
  "detailTips": [
    {
      "area": "taskCompletion" | "fluency" | "vocabulary" | "grammar" | "delivery",
      "label": "짧은 제목 (예: 콤보 확장, 시제 일관성, 연결어)",
      "text": "구체적 조언 (한국어). 사용자가 실제로 쓴 단어/표현을 인용할 것",
      "example": "영어 예시 문장 또는 교정 예시"
    }
  ],
  "vocabularyGroups": [
    { "title": "묘사 표현", "items": ["spacious", "tucked away", "surrounded by"] },
    { "title": "빈도·습관 표현", "items": ["more often than not", "every now and then"] }
  ],
  "learningActions": [
    { "label": "OPIc 콤보 3단 답변 연습", "target": 20, "unit": "세트" },
    { "label": "연결어 넣어 문장 확장하기", "target": 30, "unit": "문장" }
  ],
  "contentBreakdown": [
    { "label": "묘사", "percent": 40 },
    { "label": "경험/근거", "percent": 35 },
    { "label": "기타", "percent": 25 }
  ],
  "topicRelevance": <0~100, 질문 의도에 맞는 정도>,
  "confidence": <0~100, 표현의 확신·자연스러움 지수>,
  "grammarIssues": ["문법 오류와 한국어 교정"],
  "vocabularySuggestions": ["더 나은 어휘 제안 (한국어 설명)"],
  "betterExpressions": ["OPIc 에서 바로 쓸 수 있는 자연스러운 표현 (한국어 설명 포함)"],
  "modelAnswer": "Target-grade English sample answer in natural spoken style",
  "strengths": ["잘한 점 (한국어)"],
  "improvements": ["개선점 (한국어)"]
}

RULES:
- scoreEstimate MUST equal taskCompletion + fluency + vocabulary + grammar + delivery.
- estimatedLevel MUST be the grade band that scoreEstimate falls into. Never contradict the table.
- areas 는 5개 영역 모두 포함할 것.
- detailTips 는 5~8개. 사용자가 실제 쓴 표현을 인용해 구체적으로.
- vocabularyGroups 는 3~5개 그룹, 그룹당 3~5개 표현.
- learningActions 는 3~4개.
- contentBreakdown 의 percent 합은 100.
- modelAnswer 는 원어민이 실제로 말하듯 자연스럽게. 문어체 에세이 금지.
- Be honest and strict. 점수를 부풀리지 말 것.`;

/** 유형별 채점 초점 — user 메시지에 함께 실어 보낸다 */
const TYPE_FOCUS: Record<number, string> = {
  1: "Self-Introduction — expect name, job/school, where they live, and a few concrete details. Memorized-sounding scripts should not score above IM2 on fluency.",
  2: "Survey Topic (combo) — expect description, habit, or past experience with concrete detail. Generic answers that could apply to anyone score low on vocabulary.",
  3: "Unexpected Topic — the speaker had no chance to prepare. Reward the ability to keep going and organize on the spot; penalize long freezes and topic drift.",
  4: "Role Play — the speaker must PERFORM the task. Asking three or four real questions, or clearly explaining a problem and proposing options. Describing what they would do instead of doing it caps taskCompletion at 10.",
  5: "Advanced (comparison / issue) — expect a clear position, cause-and-effect reasoning, and contrast between past and present. Listing without analysis caps the total in the IM range.",
};

/** 요청마다 달라지는 입력부 — 캐시 경계 뒤에 오는 user 메시지 */
function buildFeedbackInput(req: FeedbackRequest): string {
  const wordCount = req.userAnswer.split(/\s+/).filter(Boolean).length;
  return `# INPUT
Question Type ${req.type} — ${TYPE_FOCUS[req.type] || "General OPIc question"}
Question: ${req.question}
${req.context ? `Situation given to the speaker: ${req.context}\n` : ""}
Answer (${wordCount} words): ${req.userAnswer}
Target grade the learner is aiming for: ${req.targetLevel}

Rate this response now. Return only the JSON object.
`;
}

/**
 * 서버 프록시(/api/ai) 호출.
 *
 * API 키는 서버(Cloudflare 환경변수)에만 존재하며 클라이언트로 내려오지 않는다.
 * system 을 별도 필드로 보내는 이유: 서버에서 프롬프트 캐싱 경계를 걸기 위함.
 */
async function callProxy(
  opts: {
    system?: string;
    cacheSystem?: boolean;
    messages: { role: string; content: string }[];
    maxTokens?: number;
    model?: string;
  },
): Promise<{ ok: boolean; content?: string; error?: string }> {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: opts.system,
        cacheSystem: opts.cacheSystem,
        messages: opts.messages,
        maxTokens: opts.maxTokens ?? 2000,
        model: opts.model,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.error || `HTTP ${data.status || "?"}` };
    }
    return { ok: true, content: data.content };
  } catch (e: any) {
    return { ok: false, error: e.message || "fetch failed" };
  }
}

export async function getFeedback(
  req: FeedbackRequest,
  config: AiConfig,
): Promise<AiFeedback> {
  const result = await callProxy({
    system: GRADING_SYSTEM_PROMPT,
    cacheSystem: true, // 정적 루브릭은 캐시 — 반복 채점 시 입력 비용 대폭 절감
    messages: [{ role: "user", content: buildFeedbackInput(req) }],
    maxTokens: 3200,
    model: config.model,
  });

  if (!result.ok || !result.content) {
    console.error("AI 채점 호출 실패:", result.error);
    const mock = strictMockFeedback(req);
    mock.improvements.unshift(`⚠ AI 채점 실패 — ${result.error || "응답 없음"}`);
    return mock;
  }

  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("응답에 JSON 없음");
    const parsed = JSON.parse(jsonMatch[0]);
    const c = parsed.criteria || {};
    // 모델이 0~100 비율로 보내도 영역 만점(20)으로 환산
    const fix = (val: any) => {
      const n = Number(val) || 0;
      return Math.max(0, Math.min(20, n > 20 ? Math.round((n / 100) * 20) : Math.round(n)));
    };
    const criteria: ScoreCriteria = {
      taskCompletion: fix(c.taskCompletion),
      fluency: fix(c.fluency),
      vocabulary: fix(c.vocabulary),
      grammar: fix(c.grammar),
      delivery: fix(c.delivery),
    };
    const sum =
      criteria.taskCompletion + criteria.fluency + criteria.vocabulary +
      criteria.grammar + criteria.delivery;
    // 모델이 보낸 총점과 영역 합이 어긋나면 영역 합을 신뢰한다 (등급이 근거와 따로 놀지 않도록)
    const reported = Number(parsed.scoreEstimate);
    const finalScore =
      Number.isFinite(reported) && Math.abs(reported - sum) <= 5
        ? Math.min(100, Math.max(0, Math.round(reported)))
        : sum;

    return withReportFallbacks(
      {
        grammarIssues: parsed.grammarIssues || [],
        vocabularySuggestions: parsed.vocabularySuggestions || [],
        betterExpressions: parsed.betterExpressions || [],
        modelAnswer: parsed.modelAnswer || "",
        estimatedLevel: scoreToLevel(finalScore),
        scoreEstimate: finalScore,
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        summaryComment: parsed.summaryComment,
        overallComment: parsed.overallComment,
        areas: parsed.areas,
        detailTips: Array.isArray(parsed.detailTips) ? parsed.detailTips : undefined,
        vocabularyGroups: Array.isArray(parsed.vocabularyGroups)
          ? parsed.vocabularyGroups
          : undefined,
        learningActions: Array.isArray(parsed.learningActions)
          ? parsed.learningActions
          : undefined,
        contentBreakdown: Array.isArray(parsed.contentBreakdown)
          ? parsed.contentBreakdown
          : undefined,
        topicRelevance:
          typeof parsed.topicRelevance === "number" ? parsed.topicRelevance : undefined,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined,
        criteria,
      },
      req,
    );
  } catch (e) {
    console.error("Parse fail:", e);
    return strictMockFeedback(req);
  }
}

const AREA_MAX: Record<CriteriaKey, number> = {
  taskCompletion: 20,
  fluency: 20,
  vocabulary: 20,
  grammar: 20,
  delivery: 20,
};

const AREA_LABEL: Record<CriteriaKey, string> = {
  taskCompletion: "과제 수행",
  fluency: "유창성",
  vocabulary: "어휘력",
  grammar: "문장 구성",
  delivery: "전달력",
};

/** 영역별 점수 비율에 따른 기본 분석 문구 (AI 응답에 areas 가 없을 때 사용) */
const AREA_TEMPLATES: Record<
  CriteriaKey,
  { high: AreaAnalysis; mid: AreaAnalysis; low: AreaAnalysis }
> = {
  taskCompletion: {
    high: {
      summary: "질문 의도를 정확히 파악하고 요구한 내용을 빠짐없이 답했어요.",
      strengths: ["질문 핵심 파악", "요구 사항 모두 충족"],
      improvements: ["구체적인 사례 한 개 더 붙이기", "답변 마무리 문장 추가"],
    },
    mid: {
      summary: "질문에는 답했지만 요구한 항목 중 일부가 빠졌어요. 묻는 것을 끝까지 확인해보세요.",
      strengths: ["주제 이해", "기본 답변 구성"],
      improvements: ["질문에서 요구한 항목 체크하기", "빠진 부분 채워 말하기"],
    },
    low: {
      summary: "질문이 요구한 과제를 수행하지 못했어요. 무엇을 묻는지 먼저 정리하고 답해보세요.",
      strengths: ["답변 시도"],
      improvements: ["질문 키워드 파악 연습", "요구 사항대로 답하기"],
    },
  },
  fluency: {
    high: {
      summary: "끊김 없이 자연스럽게 이어서 말했어요. 발화량도 충분합니다.",
      strengths: ["안정적인 속도", "충분한 발화량"],
      improvements: ["필러(um, uh) 줄이기", "긴 답변에서도 흐름 유지하기"],
    },
    mid: {
      summary: "대체로 이어서 말했지만 중간에 멈추거나 다시 시작하는 부분이 있어요.",
      strengths: ["기본 발화 유지"],
      improvements: ["문장 사이 연결어로 시간 벌기", "말문 막힐 때 쓸 표현 준비하기"],
    },
    low: {
      summary: "발화량이 부족합니다. OPIc 은 길게 말할수록 등급이 올라가는 시험이에요.",
      strengths: ["답변 시도"],
      improvements: ["한 문항당 최소 60초 말하기", "이유·예시를 붙여 문장 늘리기"],
    },
  },
  vocabulary: {
    high: {
      summary: "주제에 맞는 표현을 다양하게 사용했어요. 같은 단어 반복도 적습니다.",
      strengths: ["표현의 다양성", "자연스러운 연어(collocation)"],
      improvements: ["구동사(phrasal verb) 추가", "감정·정도 표현 넓히기"],
    },
    mid: {
      summary: "의미는 전달되지만 쉬운 단어가 반복돼요. 같은 뜻의 다른 표현을 섞어보세요.",
      strengths: ["기본 어휘 활용"],
      improvements: ["good/nice 대신 구체적 형용사 쓰기", "주제별 표현 5개씩 외우기"],
    },
    low: {
      summary: "사용한 어휘의 범위가 좁습니다. 주제별 핵심 표현부터 채워보세요.",
      strengths: ["기초 단어 사용"],
      improvements: ["주제별 필수 표현 암기", "한 문장에 형용사 하나씩 넣기"],
    },
  },
  grammar: {
    high: {
      summary: "시제가 일관되고 문장 구조도 다양해요. 복문을 안정적으로 씁니다.",
      strengths: ["시제 일관성", "복문 활용"],
      improvements: ["가정법·완료시제 섞기", "관계대명사로 문장 묶기"],
    },
    mid: {
      summary: "기본 문장은 정확하지만 시제가 흔들리거나 단문이 많아요.",
      strengths: ["기본 문형 구사"],
      improvements: ["과거 경험은 과거시제로 끝까지 유지", "because/so 로 문장 잇기"],
    },
    low: {
      summary: "문장이 자주 끊기고 오류가 반복됩니다. 기본 문형부터 다지는 게 빠릅니다.",
      strengths: ["단어 전달 시도"],
      improvements: ["주어+동사 갖춘 문장 만들기", "현재/과거 구분해서 말하기"],
    },
  },
  delivery: {
    high: {
      summary: "전달이 명료하고 강세와 끊어 읽기가 자연스러워요.",
      strengths: ["명료한 전달", "자연스러운 강세"],
      improvements: ["연음(linking) 다듬기", "문장 끝 억양 변화 주기"],
    },
    mid: {
      summary: "대체로 알아들을 수 있지만 일부 단어의 강세와 끊어 읽기가 어색해요.",
      strengths: ["기본 명료도", "적절한 속도"],
      improvements: ["단어 강세 위치 확인", "의미 단위로 끊어 말하기"],
    },
    low: {
      summary: "전달력을 높이면 등급이 크게 오릅니다. 또박또박 말하는 것부터 시작하세요.",
      strengths: ["말하기 시도"],
      improvements: ["단어 강세 기초 연습", "속도 늦추고 또렷하게 발음하기"],
    },
  },
};

/** 답변 텍스트를 키워드로 분류해 발화 내용 구성 비율 산출 */
function analyzeContent(answer: string): ContentSlice[] {
  const buckets: { label: string; re: RegExp }[] = [
    { label: "업무/역할", re: /\b(work|job|role|responsib\w*|manage\w*|team|position|task|dut\w*|department|project)\b/gi },
    { label: "경험/기간", re: /\b(year|years|month|months|since|experience\w*|been|ago|worked|joined|started)\b/gi },
    { label: "동기/이유", re: /\b(because|reason|why|chose|choose|decided|want\w*|motivat\w*|interest\w*|enjoy\w*|like)\b/gi },
    { label: "기여/성과", re: /\b(improv\w*|contribut\w*|help\w*|achiev\w*|result\w*|success\w*|growth|develop\w*|support\w*|impact)\b/gi },
  ];
  const total = answer.trim().split(/\s+/).filter(Boolean).length;
  if (total === 0) return [];

  const counts = buckets.map((b) => ({
    label: b.label,
    n: (answer.match(b.re) || []).length,
  }));
  const matched = counts.reduce((s, c) => s + c.n, 0);
  if (matched === 0) {
    return [{ label: "기타", percent: 100 }];
  }
  // 매칭 단어 비중을 기준으로 백분율 배분 (기타 = 나머지)
  const otherWeight = Math.max(0, total - matched);
  const denom = matched + otherWeight;
  const slices: ContentSlice[] = counts
    .filter((c) => c.n > 0)
    .map((c) => ({ label: c.label, percent: Math.round((c.n / denom) * 100) }));
  const used = slices.reduce((s, c) => s + c.percent, 0);
  if (used < 100) slices.push({ label: "기타", percent: 100 - used });
  return slices;
}

/**
 * AI 응답에 리포트용 필드가 없을 때 로컬에서 채워 넣는다.
 * (모델이 필드를 누락해도 결과 화면이 항상 완전하게 렌더링되도록)
 */
function withReportFallbacks(fb: AiFeedback, req: FeedbackRequest): AiFeedback {
  const c = fb.criteria;
  const out: AiFeedback = { ...fb };

  const pctOf = (k: CriteriaKey) =>
    c ? Math.round(((c[k] ?? 0) / AREA_MAX[k]) * 100) : 0;

  if (!out.areas || Object.keys(out.areas).length === 0) {
    const areas: Partial<Record<CriteriaKey, AreaAnalysis>> = {};
    (Object.keys(AREA_MAX) as CriteriaKey[]).forEach((k) => {
      const p = pctOf(k);
      const t = AREA_TEMPLATES[k];
      areas[k] = p >= 80 ? t.high : p >= 55 ? t.mid : t.low;
    });
    out.areas = areas;
  }

  if (!out.detailTips || out.detailTips.length === 0) {
    const weakest = (Object.keys(AREA_MAX) as CriteriaKey[])
      .map((k) => ({ k, p: pctOf(k) }))
      .sort((a, b) => a.p - b.p)
      .slice(0, 3);
    out.detailTips = weakest.flatMap(({ k }) =>
      (out.areas?.[k]?.improvements || []).map((imp) => ({
        area: k,
        label: AREA_LABEL[k],
        text: imp,
      })),
    );
  }

  if (!out.vocabularyGroups || out.vocabularyGroups.length === 0) {
    const groups = [
      { title: "업무/역할 표현", items: ["manage", "oversee", "coordinate", "develop", "implement"] },
      { title: "성과/기여 표현", items: ["contribute to", "drive", "enhance", "improve", "add value"] },
      { title: "팀워크 표현", items: ["collaborate with", "work closely with", "support", "facilitate"] },
      { title: "연결/강조 표현", items: ["especially", "furthermore", "in addition", "as a result"] },
    ];
    out.vocabularyGroups = groups;
  }

  if (!out.learningActions || out.learningActions.length === 0) {
    out.learningActions = [
      { label: "고급 어휘 10개씩 매일 학습하기", target: 50, unit: "개" },
      { label: "연음 & 강세 집중 연습 (주 3회)", target: 12, unit: "회" },
      { label: "모의 답변 길이 1분 이상 연습하기", target: 8, unit: "회" },
      { label: "복문/분사구문 활용 연습하기", target: 10, unit: "회" },
    ];
  }

  if (!out.contentBreakdown || out.contentBreakdown.length === 0) {
    out.contentBreakdown = analyzeContent(req.userAnswer);
  }

  if (typeof out.topicRelevance !== "number") {
    out.topicRelevance = pctOf("taskCompletion");
  }
  if (typeof out.confidence !== "number") {
    out.confidence = Math.round((pctOf("fluency") + pctOf("grammar")) / 2);
  }
  if (!out.summaryComment) {
    out.summaryComment =
      out.improvements[0] ||
      "전반적으로 안정적인 답변이에요. 세부 근거와 사례를 추가하면 점수가 더 오릅니다.";
  }
  if (!out.overallComment) {
    out.overallComment =
      (out.strengths.length ? out.strengths.join(" ") + " " : "") +
      (out.improvements.length
        ? out.improvements.slice(0, 2).join(" ")
        : "구체적인 예시를 덧붙이면 설득력이 높아집니다.");
  }

  return out;
}

function strictMockFeedback(req: FeedbackRequest): AiFeedback {
  const words = req.userAnswer.trim().split(/\s+/).filter(Boolean);
  const wc = words.length;
  const sentences = req.userAnswer.split(/[.!?]+/).filter((s) => s.trim()).length;
  const uniqueWords = new Set(words.map((w) => w.toLowerCase())).size;
  const lexicalDiversity = wc > 0 ? uniqueWords / wc : 0;
  const hasConnectors = /(however|but|because|since|so|therefore|for example|first|second|finally|in my view|i think|moreover|furthermore|consequently)/i.test(req.userAnswer);
  const advancedVocab = (req.userAnswer.match(/\b(demonstrate|consider|regarding|consequently|furthermore|implement|significant|optimize|leverage|facilitate|establish|comprehensive|effective|substantial)\b/gi) || []).length;

  // OPIc 5개 영역 각 20점 환산 (AI 미연결 시 로컬 추정치)
  const cap = (n: number) => Math.max(0, Math.min(20, Math.round(n)));

  // 1. 과제 수행 — 답변량과 문장 수로 간접 추정. 한 문장 이하면 강하게 제한
  let taskCompletion: number;
  if (wc < 15) taskCompletion = cap(wc * 0.4);
  else if (wc < 40) taskCompletion = cap(7 + sentences);
  else if (wc < 80) taskCompletion = cap(11 + sentences * 0.6);
  else if (wc < 150) taskCompletion = cap(14 + sentences * 0.4);
  else taskCompletion = cap(16 + (hasConnectors ? 2 : 0));
  if (sentences < 2) taskCompletion = Math.min(taskCompletion, 6);

  // 2. 유창성 — OPIc 은 발화량이 등급을 크게 좌우
  let fluency: number;
  if (wc < 15) fluency = cap(wc * 0.25);
  else if (wc < 40) fluency = cap(6 + (hasConnectors ? 1 : 0));
  else if (wc < 80) fluency = cap(10 + (hasConnectors ? 2 : 0) + (sentences >= 5 ? 1 : 0));
  else if (wc < 150) fluency = cap(13 + (hasConnectors ? 2 : 0) + (sentences >= 7 ? 1 : 0));
  else fluency = cap(16 + (hasConnectors ? 2 : 0));

  // 3. 어휘력 — 다양성 + 고급 표현
  let vocabulary: number;
  if (wc < 15) vocabulary = cap(wc * 0.3);
  else vocabulary = cap(6 + lexicalDiversity * 8 + Math.min(4, advancedVocab));

  // 4. 문장 구성 — 문장 수와 연결어로 확장 정도 추정
  let grammar: number;
  if (wc < 15) grammar = cap(wc * 0.35);
  else if (wc < 40) grammar = cap(7 + (sentences >= 3 ? 2 : 0));
  else if (wc < 80) grammar = cap(11 + (hasConnectors ? 2 : 0) + (sentences >= 5 ? 1 : 0));
  else grammar = cap(14 + (hasConnectors ? 3 : 0) + (sentences >= 7 ? 1 : 0));

  // 5. 전달력 — 텍스트만으로는 추정 한계가 커서 보수적으로 산정
  let delivery: number;
  if (wc < 15) delivery = cap(wc * 0.3);
  else if (wc < 40) delivery = cap(8);
  else if (wc < 80) delivery = cap(11 + (sentences >= 5 ? 1 : 0));
  else delivery = cap(13 + (hasConnectors ? 2 : 0));

  const score = taskCompletion + fluency + vocabulary + grammar + delivery;

  const errors: string[] = [];
  if (wc < 60) errors.push(`발화량 부족 (${wc}단어) — OPIc 은 문항당 80단어 이상을 권장합니다`);
  if (sentences < 4) errors.push(`문장 수 부족 (${sentences}문장) — 묘사·이유·경험으로 최소 5문장`);
  if (!hasConnectors) errors.push("논리 연결어 부재 — However / Because / For example 등 추가");
  if (advancedVocab === 0 && wc > 30) errors.push("표현이 단조로움 — actually, honestly, more often than not 같은 구어 표현 추가");

  const criteria: ScoreCriteria = { taskCompletion, fluency, vocabulary, grammar, delivery };

  return withReportFallbacks({
    grammarIssues: ["(Mock - AI 미연결) 문법 자동 검사를 사용할 수 없습니다"],
    vocabularySuggestions: [
      `(Mock) 단어 수: ${wc}개 — ${wc < 80 ? "발화량을 늘려야 합니다" : "표현 다양성을 넓혀보세요"}`,
    ],
    betterExpressions: [
      "(Mock) 도입: 'Well, let me think about that for a second...'",
      "(Mock) 확장: 'Actually, the main reason is...' / 'For instance,...'",
    ],
    modelAnswer: req.sampleAnswer
      ? `(목표 등급 ${req.targetLevel} 기준)\n\n${req.sampleAnswer}`
      : "(AI 연결 시 목표 등급 맞춤 모범답안 생성)",
    estimatedLevel: scoreToLevel(score),
    scoreEstimate: score,
    strengths: [
      wc >= 80 ? `발화량 충분 (${wc}단어)` : `답변 시도 (${wc}단어)`,
    ],
    improvements: errors.length > 0 ? errors : [
      "구체적인 사례와 경험 덧붙이기",
      "연결어로 문장을 이어 붙여 답변 늘리기",
    ],
    criteria,
  }, req);
}

export async function testConnection(
  config: AiConfig = {},
): Promise<{ ok: boolean; message: string; details?: string }> {

  const result = await callProxy({
    messages: [{ role: "user", content: "Reply with just OK" }],
    maxTokens: 64,
    model: config.model,
  });
  if (!result.ok) {
    return {
      ok: false,
      message: result.error || "연결 실패",
      details: result.error,
    };
  }
  return {
    ok: true,
    message: `연결 성공 — 응답: "${(result.content || "").slice(0, 50)}"`,
  };
}

export async function translateWord(
  word: string,
  config: AiConfig,
): Promise<string> {
  if (typeof window !== "undefined") {
    const cache = JSON.parse(localStorage.getItem("spa.wordCache") || "{}");
    if (cache[word.toLowerCase()]) return cache[word.toLowerCase()];
  }



  const result = await callProxy({
    system:
      "You are a Korean-English dictionary. Output only the most common Korean meaning of the given English word in 5 characters or fewer. No explanation, no punctuation.",
    messages: [{ role: "user", content: word }],
    maxTokens: 64,
    model: config.model,
  });

  if (!result.ok || !result.content) return "—";

  const meaning = result.content.trim().replace(/^["']|["']$/g, "");
  if (typeof window !== "undefined") {
    const cache = JSON.parse(localStorage.getItem("spa.wordCache") || "{}");
    cache[word.toLowerCase()] = meaning;
    localStorage.setItem("spa.wordCache", JSON.stringify(cache));
  }
  return meaning;
}

export async function translateText(
  text: string,
  config: AiConfig,
): Promise<string> {


  const result = await callProxy({
    system:
      "You are a professional Korean translator. Translate the given English text to natural Korean. Output only the Korean translation, no explanations or quotation marks.",
    messages: [{ role: "user", content: text }],
    maxTokens: 800,
    model: config.model,
  });

  if (!result.ok || !result.content) {
    return `(번역 실패: ${result.error || "응답 없음"})`;
  }
  return result.content.trim().replace(/^["']|["']$/g, "");
}

export async function transcribeAudio(
  blob: Blob,
  apiKey: string,
  model = "whisper-1",
): Promise<{ ok: boolean; text?: string; error?: string }> {
  if (!apiKey) return { ok: false, error: "API 키가 없습니다" };
  try {
    const form = new FormData();
    form.append("audio", blob, "speech.webm");
    form.append("model", model);
    const res = await fetch("/api/stt", {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: form,
    });
    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.error || "변환 실패" };
    return { ok: true, text: data.text };
  } catch (e: any) {
    return { ok: false, error: e.message || "fetch 실패" };
  }
}
