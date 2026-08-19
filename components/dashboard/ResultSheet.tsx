"use client";

import { gradeIndex } from "@/lib/scoring";
import type { Level, ScoreCriteria } from "@/types";

export interface ResultSheetData {
  name: string;
  team?: string;
  date?: string;
  totalScore: number;
  level: Level;
  criteria: ScoreCriteria;
}

const AREAS = [
  { key: "languageControl", label: "언어 정확도", max: 20, desc: "Language Control · 문법·어휘·유창성·발음" },
  { key: "functionTasks", label: "과제 수행력", max: 20, desc: "Function / Global Tasks · 즉흥적 과제 수행" },
  { key: "textType", label: "발화 구성력", max: 20, desc: "Text Type · 단어 → 문장 → 문단" },
  { key: "contentsContext", label: "내용 표현력", max: 20, desc: "Contents / Context · 주제와 상황 표현" },
  { key: "comprehensibility", label: "질문 이해도", max: 20, desc: "Comprehensibility · 질문 의도 파악" },
] as const;

function recommendation(lv: Level) {
  const i = gradeIndex(lv);
  if (i <= 2) {
    return {
      delivery: "또박또박 — 단어 강세부터 잡기",
      structure: "주어+동사 갖춘 한 문장 완성",
      fluency: "한 문항당 3문장 이상 말하기",
    };
  }
  if (i <= 4) {
    return {
      delivery: "의미 단위로 끊어 말하기",
      structure: "이유와 예시 한 개씩 붙이기",
      fluency: "한 문항당 40초 이상 발화",
    };
  }
  if (i <= 6) {
    return {
      delivery: "연음(linking)과 문장 끝 억양",
      structure: "묘사 → 습관 → 경험 콤보 3단 구성",
      fluency: "한 문항당 60~90초 발화 유지",
    };
  }
  return {
    delivery: "감정·강조 뉘앙스까지 살리기",
    structure: "비교·인과 구조로 논지 전개",
    fluency: "돌발 주제에도 90초 이상 즉답",
  };
}

export default function ResultSheet({ data }: { data: ResultSheetData }) {
  const rec = recommendation(data.level);
  const areas = AREAS.map((a) => {
    const raw = Math.max(0, Math.min(a.max, (data.criteria as any)[a.key] ?? 0));
    return { ...a, raw, pct: Math.round((raw / a.max) * 100) };
  });

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-brand-gray-200 shadow-lg">
      <div className="text-center mb-6">
        <div className="text-xs font-bold tracking-[0.25em] text-brand-blue mb-1">
          WONPIC OFFICIAL REPORT
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-brand-ink">
          <span className="text-brand-blue">OPIc</span> 진단 결과지
        </h2>
        {data.date && (
          <div className="text-xs text-brand-gray-500 mt-1">발급일 {data.date}</div>
        )}
      </div>

      {/* 상단: 응시자 + 총점 */}
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-5 text-center">
          <div className="text-[10px] font-bold text-brand-blue tracking-widest mb-2">응시자 정보</div>
          <div className="text-4xl font-black text-brand-navy mb-1">{data.level}</div>
          <div className="text-sm font-bold text-brand-ink">{data.name}</div>
          {data.team && <div className="text-xs text-brand-gray-500 mt-0.5">{data.team}</div>}
        </div>

        <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-5 text-center flex flex-col justify-center">
          <div className="text-[10px] font-bold text-brand-blue tracking-widest mb-1">환산 점수</div>
          <div className="text-5xl font-black text-brand-blue leading-none">
            {data.totalScore}
            <span className="text-lg text-brand-gray-400 font-bold"> / 100</span>
          </div>
          <div className="w-full bg-brand-gray-100 rounded-full h-2 overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-brand-blue to-brand-navy h-2"
              style={{ width: `${data.totalScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* 영역별 점수 — 5개 영역 각 20점 */}
      <div className="mb-6">
        <h3 className="font-black text-brand-ink text-base mb-1">📊 평가 영역별 점수</h3>
        <p className="text-xs text-brand-gray-500 mb-4">
          OPIc 공식 5개 평가 영역 (각 20점 환산, 합계 100점)
        </p>
        <div className="space-y-3">
          {areas.map((a) => {
            const color =
              a.pct >= 75
                ? "bg-green-500"
                : a.pct >= 50
                ? "bg-brand-blue"
                : a.pct >= 25
                ? "bg-amber-500"
                : "bg-brand-red";
            return (
              <div key={a.key}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-bold text-brand-ink">{a.label}</span>
                    <span className="text-[11px] text-brand-gray-500 ml-2">{a.desc}</span>
                  </div>
                  <span className="text-sm font-black tabular-nums">
                    <span className="text-brand-blue">{a.raw}</span>
                    <span className="text-brand-gray-400"> / {a.max}</span>
                  </span>
                </div>
                <div className="w-full bg-brand-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`${color} h-3 rounded-full transition-all`}
                    style={{ width: `${Math.max(2, a.pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="border-t border-brand-gray-200 pt-3 mt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-brand-ink">총점</span>
            <span className="text-xl font-black text-brand-navy">
              {data.totalScore} <span className="text-sm text-brand-gray-500">/ 96</span>
            </span>
          </div>
        </div>
      </div>

      {/* 추천 학습 단계 */}
      <div>
        <h3 className="font-black text-brand-ink text-base mb-3">📚 맞춤 학습 추천</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <RecCard color="blue" title="전달력 강화" body={rec.delivery} />
          <RecCard color="navy" title="답변 구조 강화" body={rec.structure} />
          <RecCard color="red" title="유창성 강화" body={rec.fluency} />
        </div>
      </div>

      <p className="text-[11px] text-brand-gray-500 leading-relaxed mt-5 pt-4 border-t border-brand-gray-100">
        ※ 실제 OPIc 은 총점을 매기지 않고 ACTFL 기준으로 등급을 판정합니다. 본 결과지는 학습 방향을
        잡기 위해 5개 영역을 각 20점(합계 100점)으로 환산한 AI 진단 결과이며, 공식 점수가 아닙니다.
      </p>
    </div>
  );
}

function RecCard({
  color,
  title,
  body,
}: {
  color: "blue" | "navy" | "red";
  title: string;
  body: string;
}) {
  const ring =
    color === "blue"
      ? "border-l-brand-blue bg-brand-blue/5"
      : color === "navy"
      ? "border-l-brand-navy bg-brand-navy/5"
      : "border-l-brand-red bg-brand-red/5";
  const text =
    color === "blue"
      ? "text-brand-blue"
      : color === "navy"
      ? "text-brand-navy"
      : "text-brand-red";
  return (
    <div className={`border-l-4 rounded-xl px-4 py-3 ${ring}`}>
      <div className={`text-xs font-black tracking-wider ${text} mb-1`}>{title}</div>
      <div className="text-sm text-brand-ink font-semibold leading-snug">{body}</div>
    </div>
  );
}
