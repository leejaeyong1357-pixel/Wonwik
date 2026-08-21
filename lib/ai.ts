import type {
  AiFeedback,
  QuestionType,
  Level,
  CriteriaKey,
  AreaAnalysis,
  ContentSlice,
  Correction,
  ScoreCriteria,
  Upgrade,
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
export const GRADING_SYSTEM_PROMPT = `You are an official OPIc rater. You judge one spoken response and assign an ACTFL-based OPIc grade.

# THE FIVE OFFICIAL OPIC EVALUATION CATEGORIES
Rate each 0-20. These are the actual categories OPIc uses — do not invent others.

1. languageControl (Language Control)
   Grammar, Vocabulary, Fluency, Pronunciation. Accuracy of form.

2. functionTasks (Function / Global Tasks)
   Can the speaker perform the language task consistently, comfortably, steadily,
   and spontaneously? Describing, narrating, comparing, asking, resolving.

3. textType (Text Type)
   The LENGTH and ORGANIZATION of the speech, measured on this ladder:
   words → phrases → sentences → connected sentences → paragraphs.
   Isolated words cap this at 4. Simple sentences cap it at 10.
   Connected sentences reach 14. True paragraph-length discourse reaches 18-20.

4. contentsContext (Contents / Context)
   Ability to express the topic and the situation. Concrete, specific,
   situation-appropriate content scores high. Vague filler that could apply to
   any question scores low.

5. comprehensibility (Comprehensibility)
   Did the speaker understand what the interviewer actually asked?
   Answering a different question than the one asked caps this at 6.

# OFFICIAL OPIC LEVEL DESCRIPTORS — anchor your grade to these
Advanced Low (AL)
  Manages verb tenses consistently when narrating events. Uses varied adjectives
  when describing people and things. Places connectives well, so cohesion between
  sentences is strong and paragraph structure is handled skillfully. Can explain
  and resolve a problem even in an unfamiliar, complicated situation.

Intermediate High (IH)
  When facing an unfamiliar or unexpected complicated situation, can describe the
  event and resolve the problem effectively in most situations. Volume of speech
  is large and vocabulary is varied.

Intermediate Mid (IM1 < IM2 < IM3)
  Beyond everyday topics, in personally familiar situations, can string sentences
  together and speak naturally. Experiments with varied sentence forms and
  vocabulary. Can hold a long conversation if the listener accommodates a little.

Intermediate Low (IL)
  Can speak in sentences about everyday topics. Participates in conversation and
  speaks with confidence on preferred topics.

Novice High (NH)
  Can speak in sentences about most everyday topics. Can ask and answer questions
  about personal information.

Novice Mid (NM)
  Can speak using already memorized words or sentences.

Novice Low (NL)
  Can list English words, at a limited level.

# GRADE FROM THE DESCRIPTORS FIRST, THEN SCORE
Decide the grade by matching the answer against the descriptors above.
Then set the five category scores so their sum lands inside that grade's band:
NL 0-14 / NM 15-24 / NH 25-34 / IL 35-44 / IM1 45-54 / IM2 55-64 / IM3 65-74 / IH 75-87 / AL 88-100
Never let the grade and the total contradict each other.

# BE STRICT AND HONEST
- Under 15 words cannot exceed NH. Under 40 words cannot exceed IL.
- A long but repetitive answer stays in the IM range — volume alone is not IH.
- IH requires handling the unexpected AND large volume AND varied vocabulary.
- AL requires consistent tense control, varied adjectives, and well-placed connectives.
- You are reading a speech-to-text transcript. Judge pronunciation only from word
  choice and phrasing; never invent claims about accent you cannot hear.

# THE MOST IMPORTANT PART — QUOTE THE LEARNER
Generic advice is worthless. Every correction and upgrade MUST quote the learner's
own words verbatim in "original". If the answer is too short to find real examples,
return fewer items rather than inventing them. Never write placeholder advice like
"try speaking more" without tying it to something they actually said.

# OUTPUT — return ONLY valid JSON (no markdown fences, no commentary)
Korean text in 한국어 존댓말(~요체). English only inside original/corrected/better/modelAnswer.

{
  "estimatedLevel": "<NL|NM|NH|IL|IM1|IM2|IM3|IH|AL>",
  "criteria": {
    "languageControl": <0~20>,
    "functionTasks": <0~20>,
    "textType": <0~20>,
    "contentsContext": <0~20>,
    "comprehensibility": <0~20>
  },
  "scoreEstimate": <sum of the five, 0~100>,
  "gradeReason": "이 등급으로 판정한 이유. 레벨 기술서의 어떤 조건을 충족했고 어떤 조건에서 막혔는지 (한국어 2~3문장)",
  "summaryComment": "한 줄 총평 (한국어)",
  "overallComment": "3~4문장 총평. 답변에서 실제로 나온 내용을 언급할 것 (한국어)",
  "corrections": [
    {
      "original": "학습자가 실제로 말한 문장을 그대로 인용",
      "corrected": "고친 문장",
      "issue": "무엇이 왜 틀렸는지 (한국어)",
      "rule": "시제 일치 / 관사 / 전치사 등"
    }
  ],
  "upgrades": [
    {
      "original": "학습자가 쓴 표현 그대로",
      "better": "더 높은 등급으로 들리는 대체 표현",
      "why": "왜 더 나은지 (한국어)"
    }
  ],
  "areas": {
    "languageControl": { "summary": "이 영역 평가 (한국어, 답변 인용 포함)", "strengths": ["..."], "improvements": ["..."] },
    "functionTasks": { "summary": "...", "strengths": ["..."], "improvements": ["..."] },
    "textType": { "summary": "...", "strengths": ["..."], "improvements": ["..."] },
    "contentsContext": { "summary": "...", "strengths": ["..."], "improvements": ["..."] },
    "comprehensibility": { "summary": "...", "strengths": ["..."], "improvements": ["..."] }
  },
  "toNextGrade": ["다음 등급으로 올라가기 위해 필요한 구체적 행동 2~4개 (한국어)"],
  "strengths": ["잘한 점 (한국어, 답변 인용)"],
  "improvements": ["개선점 (한국어, 답변 인용)"],
  "modelAnswer": "Same question answered at the learner's target grade, in natural spoken English"
}

RULES
- scoreEstimate MUST equal the sum of the five categories.
- estimatedLevel MUST fall inside the band that scoreEstimate lands in.
- corrections: 2~5개. 오류가 정말 없으면 빈 배열.
- upgrades: 2~5개. 반드시 학습자가 쓴 표현에서 출발할 것.
- areas 는 5개 영역 모두 포함.
- modelAnswer 는 말하듯 자연스럽게. 에세이 문어체 금지.
- 점수를 부풀리지 말 것.`;

/** 유형별 채점 초점 — user 메시지에 함께 실어 보낸다 */
const TYPE_FOCUS: Record<number, string> = {
  1: "Self-Introduction — expect name, job/school, where they live, and a few concrete details. Memorized-sounding scripts should not score above IM2 on fluency.",
  2: "Survey Topic (combo) — expect description, habit, or past experience with concrete detail. Generic answers that could apply to anyone score low on vocabulary.",
  3: "Unexpected Topic — the speaker had no chance to prepare. Reward the ability to keep going and organize on the spot; penalize long freezes and topic drift.",
  4: "Role Play — the speaker must PERFORM the task. Asking three or four real questions, or clearly explaining a problem and proposing options. Describing what they would do instead of doing it caps functionTasks at 10.",
  5: "Advanced (comparison / issue) — expect a clear position, cause-and-effect reasoning, and contrast between past and present. Listing without analysis caps the total in the IM range.",
};


/** 비교용 정규화 — 대소문자·구두점·공백 차이를 무시 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * 인용 검증.
 *
 * 모델이 학습자가 하지도 않은 말을 인용하면 피드백이 통째로 거짓이 된다.
 * original 이 실제 답변에 존재할 때만 통과시킨다.
 */
function quotedFromAnswer(original: unknown, answer: string): string | null {
  if (typeof original !== "string") return null;
  const q = original.trim();
  if (q.length < 2) return null;
  return normalize(answer).includes(normalize(q)) ? q : null;
}

function sanitizeCorrections(raw: unknown, answer: string): Correction[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: Correction[] = [];
  for (const item of raw) {
    const original = quotedFromAnswer(item?.original, answer);
    if (!original) continue;
    const corrected = typeof item?.corrected === "string" ? item.corrected.trim() : "";
    const issue = typeof item?.issue === "string" ? item.issue.trim() : "";
    if (!corrected || !issue) continue;
    out.push({
      original,
      corrected,
      issue,
      rule: typeof item?.rule === "string" ? item.rule : undefined,
    });
  }
  return out.length ? out.slice(0, 6) : undefined;
}

function sanitizeUpgrades(raw: unknown, answer: string): Upgrade[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: Upgrade[] = [];
  for (const item of raw) {
    const original = quotedFromAnswer(item?.original, answer);
    if (!original) continue;
    const better = typeof item?.better === "string" ? item.better.trim() : "";
    const why = typeof item?.why === "string" ? item.why.trim() : "";
    if (!better || !why) continue;
    out.push({ original, better, why });
  }
  return out.length ? out.slice(0, 6) : undefined;
}

/** 요청마다 달라지는 입력부 — 캐시 경계 뒤에 오는 user 메시지 */
function buildFeedbackInput(req: FeedbackRequest): string {
  const wordCount = req.userAnswer.split(/\s+/).filter(Boolean).length;
  return `# INPUT
Question Type ${req.type} — ${TYPE_FOCUS[req.type] || "General OPIc question"}
${req.context ? `Situation given to the speaker: ${req.context}\n` : ""}Question: ${req.question}
Answer (${wordCount} words): ${req.userAnswer}

Target grade the learner is aiming for: ${req.targetLevel}

Rate this now. Quote the learner's own words. Return only the JSON object.
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
    effort?: "low" | "medium" | "high";
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
        effort: opts.effort,
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
    maxTokens: 2600,
    effort: "low",
    model: config.model,
  });

  if (!result.ok || !result.content) {
    console.error("AI 채점 호출 실패:", result.error);
    const mock = strictMockFeedback(req);
    mock.isFallback = true;
    mock.fallbackReason = result.error || "AI 서버에서 응답이 오지 않았습니다";
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
      languageControl: fix(c.languageControl),
      functionTasks: fix(c.functionTasks),
      textType: fix(c.textType),
      contentsContext: fix(c.contentsContext),
      comprehensibility: fix(c.comprehensibility),
    };
    const sum =
      criteria.languageControl + criteria.functionTasks + criteria.textType +
      criteria.contentsContext + criteria.comprehensibility;
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
        gradeReason: typeof parsed.gradeReason === "string" ? parsed.gradeReason : undefined,
        toNextGrade: Array.isArray(parsed.toNextGrade) ? parsed.toNextGrade : undefined,
        corrections: sanitizeCorrections(parsed.corrections, req.userAnswer),
        upgrades: sanitizeUpgrades(parsed.upgrades, req.userAnswer),
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
    const mock = strictMockFeedback(req);
    mock.isFallback = true;
    mock.fallbackReason = "AI 응답 형식을 해석하지 못했습니다";
    return mock;
  }
}

const AREA_MAX: Record<CriteriaKey, number> = {
  languageControl: 20,
  functionTasks: 20,
  textType: 20,
  contentsContext: 20,
  comprehensibility: 20,
};

const AREA_LABEL: Record<CriteriaKey, string> = {
  languageControl: "언어 정확도",
  functionTasks: "과제 수행력",
  textType: "발화 구성력",
  contentsContext: "내용 표현력",
  comprehensibility: "질문 이해도",
};

/**
 * AI 응답에 areas 가 없을 때만 쓰는 최소 폴백.
 *
 * 여기 문구는 답변을 인용하지 못하므로 일부러 짧게 유지한다.
 * 상세 피드백은 반드시 모델이 학습자 답변을 인용해 만들어야 한다.
 */
const AREA_TEMPLATES: Record<
  CriteriaKey,
  { high: AreaAnalysis; mid: AreaAnalysis; low: AreaAnalysis }
> = {
  languageControl: {
    high: {
      summary: "문법과 어휘 사용이 안정적이에요.",
      strengths: ["시제 일관성", "정확한 어휘 선택"],
      improvements: ["복문 구조 다양화", "구동사 활용 늘리기"],
    },
    mid: {
      summary: "의미는 전달되지만 문법 오류와 어휘 반복이 보여요.",
      strengths: ["기본 문형 구사"],
      improvements: ["시제 끝까지 유지하기", "같은 단어 반복 줄이기"],
    },
    low: {
      summary: "기본 문형부터 다지는 것이 가장 빠릅니다.",
      strengths: ["의사 전달 시도"],
      improvements: ["주어+동사 갖춘 문장 만들기", "현재/과거 구분해서 말하기"],
    },
  },
  functionTasks: {
    high: {
      summary: "요구된 과제를 끊김 없이 수행했어요.",
      strengths: ["과제 완수", "즉흥 대응"],
      improvements: ["예상 못한 질문까지 확장 연습"],
    },
    mid: {
      summary: "과제는 수행했지만 일부 요구 사항이 빠졌어요.",
      strengths: ["주제 파악"],
      improvements: ["질문이 요구한 항목 빠짐없이 답하기"],
    },
    low: {
      summary: "요구된 과제를 수행하지 못했어요.",
      strengths: ["답변 시도"],
      improvements: ["질문의 동사(describe/compare/ask)에 맞춰 답하기"],
    },
  },
  textType: {
    high: {
      summary: "문단 단위로 연결해 말했어요.",
      strengths: ["문단 구성", "연결어 활용"],
      improvements: ["문단 간 전환 표현 다듬기"],
    },
    mid: {
      summary: "문장은 만들지만 문단으로 이어지지 않아요.",
      strengths: ["문장 단위 발화"],
      improvements: ["because/so/also 로 문장 잇기", "한 주제당 4문장 이상"],
    },
    low: {
      summary: "단어와 짧은 구 수준에 머물러 있어요.",
      strengths: ["단어 전달"],
      improvements: ["완전한 문장으로 말하기"],
    },
  },
  contentsContext: {
    high: {
      summary: "주제와 상황에 맞는 구체적인 내용을 담았어요.",
      strengths: ["구체적 사례", "상황 적합성"],
      improvements: ["개인 경험 한 가지 더 붙이기"],
    },
    mid: {
      summary: "내용이 일반적이에요. 나만의 구체성이 필요합니다.",
      strengths: ["주제 관련성 유지"],
      improvements: ["숫자·장소·이름 같은 구체적 정보 넣기"],
    },
    low: {
      summary: "주제에 대한 내용이 거의 담기지 않았어요.",
      strengths: ["답변 시도"],
      improvements: ["질문 주제에 대해 아는 것부터 말하기"],
    },
  },
  comprehensibility: {
    high: {
      summary: "질문 의도를 정확히 파악했어요.",
      strengths: ["질문 이해"],
      improvements: ["세부 조건까지 확인하기"],
    },
    mid: {
      summary: "질문은 이해했지만 일부 초점이 어긋났어요.",
      strengths: ["대체적인 이해"],
      improvements: ["질문의 핵심 단어 먼저 짚기"],
    },
    low: {
      summary: "질문 의도와 다른 답변이에요.",
      strengths: ["발화 시도"],
      improvements: ["문제 듣기를 한 번 더 활용하기"],
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
    out.topicRelevance = pctOf("comprehensibility");
  }
  if (typeof out.confidence !== "number") {
    out.confidence = Math.round((pctOf("languageControl") + pctOf("textType")) / 2);
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

  // 공식 5영역 각 20점 환산 (AI 미연결 시 로컬 추정치 — 인용 피드백은 불가)
  const cap = (n: number) => Math.max(0, Math.min(20, Math.round(n)));

  // Language Control — 어휘 다양성과 고급 표현으로 간접 추정
  const languageControl =
    wc < 15 ? cap(wc * 0.3) : cap(6 + lexicalDiversity * 7 + Math.min(4, advancedVocab));

  // Function / Global Tasks — 과제를 지속적으로 수행했는지: 문장 수와 연결어
  const functionTasks =
    wc < 15 ? cap(wc * 0.35) : cap(6 + sentences * 0.9 + (hasConnectors ? 2 : 0));

  // Text Type — 단어 → 구 → 문장 → 접합 문장 → 문단 사다리
  let textType: number;
  if (wc < 15 || sentences < 2) textType = cap(4);
  else if (wc < 40) textType = cap(9);
  else if (wc < 80) textType = cap(hasConnectors ? 14 : 12);
  else if (wc < 150) textType = cap(hasConnectors ? 17 : 15);
  else textType = cap(hasConnectors ? 19 : 16);

  // Contents / Context — 발화량과 어휘 다양성으로 구체성 추정
  const contentsContext =
    wc < 15 ? cap(wc * 0.3) : cap(5 + wc / 12 + lexicalDiversity * 4);

  // Comprehensibility — 텍스트만으로는 판정 불가. 최소한의 형태만 확인
  const comprehensibility = sentences < 2 ? cap(6) : cap(wc < 40 ? 10 : 13);

  const score =
    languageControl + functionTasks + textType + contentsContext + comprehensibility;

  const errors: string[] = [];
  if (wc < 60) errors.push(`발화량 부족 (${wc}단어) — OPIc 은 문항당 80단어 이상을 권장합니다`);
  if (sentences < 4) errors.push(`문장 수 부족 (${sentences}문장) — 묘사·이유·경험으로 최소 5문장`);
  if (!hasConnectors) errors.push("논리 연결어 부재 — However / Because / For example 등 추가");
  if (advancedVocab === 0 && wc > 30) errors.push("표현이 단조로움 — actually, honestly, more often than not 같은 구어 표현 추가");

  const criteria: ScoreCriteria = {
    languageControl,
    functionTasks,
    textType,
    contentsContext,
    comprehensibility,
  };

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
