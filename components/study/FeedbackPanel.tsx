"use client";

import { useMemo, useState } from "react";
import type { AiFeedback, CriteriaKey, Level, SpeakingMetrics } from "@/types";
import { CRITERIA_DESC, CRITERIA_KO, CRITERIA_LABEL, CRITERIA_MAX } from "@/types";
import { GRADE_NAMES, gradeIndex, levelDescription, nextGrade } from "@/lib/scoring";
import { storage } from "@/lib/storage";
import { DEFAULT_TARGET_GRADE } from "@/lib/constants";
import Card from "@/components/ui/Card";

interface Props {
  loading: boolean;
  feedback: AiFeedback | null;
  userAnswer: string;
  sampleAnswer: string;
  onRestart: () => void;
  metrics?: SpeakingMetrics;
}

const AREA_KEYS: CriteriaKey[] = [
  "languageControl",
  "functionTasks",
  "textType",
  "contentsContext",
  "comprehensibility",
];

type Tab = "diagnosis" | "corrections" | "model";

export default function FeedbackPanel({
  loading,
  feedback,
  userAnswer,
  sampleAnswer,
  onRestart,
  metrics,
}: Props) {
  const [tab, setTab] = useState<Tab>("corrections");

  const settings = useMemo(() => storage.getSettings(), []);
  const targetLevel = (settings.targetLevel || DEFAULT_TARGET_GRADE) as Level;

  const wordCount = useMemo(
    () => userAnswer.trim().split(/\s+/).filter(Boolean).length,
    [userAnswer],
  );

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-brand-gray-700 font-semibold">
              AI가 답변을 채점하고 있어요...
            </p>
            <p className="text-xs text-brand-gray-500 mt-1">
              공식 5개 평가 영역 · 문장별 교정 · 표현 업그레이드
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!feedback) return null;

  const level = feedback.estimatedLevel;
  const reached = gradeIndex(level) >= gradeIndex(targetLevel);
  const corrections = feedback.corrections || [];
  const upgrades = feedback.upgrades || [];
  const hasQuoted = corrections.length > 0 || upgrades.length > 0;

  const tabBtn = (id: Tab, label: string, badge?: number) => (
    <button
      onClick={() => setTab(id)}
      className={`px-4 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-colors ${
        tab === id
          ? "bg-brand-blue text-white"
          : "bg-white border border-brand-gray-200 text-brand-gray-700 hover:border-brand-blue hover:text-brand-blue"
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className={`ml-1.5 text-[11px] ${
            tab === id ? "text-blue-100" : "text-brand-gray-400"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* ── 등급 판정 ── */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-xs font-bold text-brand-red mb-1">예상 등급</div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-6xl font-black text-brand-navy leading-none">
                {level}
              </span>
              <span className="text-sm font-semibold text-brand-gray-600">
                {GRADE_NAMES[level]}
              </span>
            </div>
            <p className="text-sm text-brand-gray-700 mt-2 max-w-md leading-relaxed">
              {levelDescription(level)}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs text-brand-gray-500 mb-1">목표 {targetLevel}</div>
            <div
              className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold ${
                reached
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {reached ? "✓ 목표 도달" : `${targetLevel} 까지 남음`}
            </div>
            <div className="text-[11px] text-brand-gray-400 mt-2">
              발화량 {wordCount}단어
            </div>
          </div>
        </div>

        {/* 등급 사다리 */}
        <GradeLadder current={level} target={targetLevel} />

        {feedback.gradeReason && (
          <div className="mt-4 p-3 bg-brand-navy/5 border border-brand-navy/15 rounded-xl">
            <div className="text-[10px] font-black tracking-wider text-brand-navy mb-1">
              왜 {level} 인가
            </div>
            <p className="text-sm text-brand-ink leading-relaxed">
              {feedback.gradeReason}
            </p>
          </div>
        )}

        {feedback.toNextGrade && feedback.toNextGrade.length > 0 && (
          <div className="mt-3 p-3 bg-brand-blue/5 border border-brand-blue/20 rounded-xl">
            <div className="text-[10px] font-black tracking-wider text-brand-blue mb-1.5">
              {nextGrade(level)} 로 올라가려면
            </div>
            <ul className="space-y-1 text-sm text-brand-ink">
              {feedback.toNextGrade.map((t, i) => (
                <li key={i} className="leading-relaxed">
                  • {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabBtn("corrections", "✍️ 내 답변 교정", corrections.length + upgrades.length)}
        {tabBtn("diagnosis", "📊 영역별 진단")}
        {tabBtn("model", "⭐ 모범 답안")}
      </div>

      {/* ── 내 답변 교정 ── */}
      {tab === "corrections" && (
        <div className="space-y-4">
          {!hasQuoted && (
            <Card>
              <div className="py-6 text-center">
                <div className="text-3xl mb-2">🔌</div>
                <p className="text-sm font-semibold text-brand-ink mb-1">
                  문장별 교정을 만들지 못했어요
                </p>
                <p className="text-xs text-brand-gray-500 leading-relaxed">
                  AI 채점이 연결되지 않았거나 답변이 너무 짧으면 인용 교정이 나오지
                  않습니다. 답변을 조금 더 길게 말한 뒤 다시 채점해보세요.
                </p>
              </div>
            </Card>
          )}

          {corrections.length > 0 && (
            <Card>
              <h3 className="font-bold text-brand-ink mb-1">📝 문법 교정</h3>
              <p className="text-xs text-brand-gray-500 mb-4">
                내가 실제로 말한 문장을 그대로 가져와 고쳤어요.
              </p>
              <div className="space-y-4">
                {corrections.map((c, i) => (
                  <div
                    key={i}
                    className="border border-brand-gray-200 rounded-2xl overflow-hidden"
                  >
                    <div className="p-3 bg-red-50 border-b border-red-100">
                      <div className="text-[10px] font-black tracking-wider text-red-700 mb-1">
                        내가 말한 문장
                      </div>
                      <p className="text-sm text-brand-ink leading-relaxed line-through decoration-red-400/60">
                        {c.original}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 border-b border-green-100">
                      <div className="text-[10px] font-black tracking-wider text-green-700 mb-1">
                        이렇게 고치세요
                      </div>
                      <p className="text-sm font-semibold text-brand-ink leading-relaxed">
                        {c.corrected}
                      </p>
                    </div>
                    <div className="p-3">
                      {c.rule && (
                        <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-navy/10 text-brand-navy mb-1.5">
                          {c.rule}
                        </span>
                      )}
                      <p className="text-sm text-brand-gray-700 leading-relaxed">
                        {c.issue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {upgrades.length > 0 && (
            <Card>
              <h3 className="font-bold text-brand-ink mb-1">💡 표현 업그레이드</h3>
              <p className="text-xs text-brand-gray-500 mb-4">
                틀리진 않았지만, 이렇게 바꾸면 한 등급 위로 들립니다.
              </p>
              <div className="space-y-3">
                {upgrades.map((u, i) => (
                  <div
                    key={i}
                    className="p-3 border border-brand-gray-200 rounded-2xl"
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-sm text-brand-gray-500 line-through">
                        {u.original}
                      </span>
                      <span className="text-brand-blue font-bold">→</span>
                      <span className="text-sm font-bold text-brand-blue">
                        {u.better}
                      </span>
                    </div>
                    <p className="text-sm text-brand-gray-700 leading-relaxed">
                      {u.why}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="font-bold text-brand-ink mb-2">🗣 내 답변 원문</h3>
            <p className="text-sm text-brand-gray-700 leading-relaxed bg-brand-gray-50 p-4 rounded-xl whitespace-pre-wrap">
              {userAnswer || "(답변 없음)"}
            </p>
          </Card>
        </div>
      )}

      {/* ── 영역별 진단 ── */}
      {tab === "diagnosis" && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold text-brand-ink mb-1">
              📐 OPIc 공식 평가 영역
            </h3>
            <p className="text-xs text-brand-gray-500 mb-4">
              실제 OPIc 이 보는 5개 축입니다. 각 20점으로 환산했습니다.
            </p>
            <div className="space-y-4">
              {AREA_KEYS.map((key) => {
                const v = feedback.criteria?.[key] ?? 0;
                const max = CRITERIA_MAX[key];
                const pct = (v / max) * 100;
                const color =
                  pct >= 75
                    ? "bg-green-500"
                    : pct >= 50
                    ? "bg-brand-blue"
                    : pct >= 25
                    ? "bg-amber-500"
                    : "bg-brand-red";
                const area = feedback.areas?.[key];
                return (
                  <div key={key}>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <span className="font-bold text-brand-ink">
                          {CRITERIA_KO[key]}
                        </span>
                        <span className="text-[11px] text-brand-gray-500 ml-1.5">
                          {CRITERIA_LABEL[key]}
                        </span>
                      </div>
                      <span className="text-sm font-bold tabular-nums shrink-0">
                        <span className="text-brand-blue">{v}</span>
                        <span className="text-brand-gray-400"> / {max}</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-brand-gray-400 mb-1.5">
                      {CRITERIA_DESC[key]}
                    </div>
                    <div className="w-full bg-brand-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`${color} h-2.5 rounded-full transition-all`}
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                    {area?.summary && (
                      <p className="text-sm text-brand-gray-700 leading-relaxed mt-2">
                        {area.summary}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {feedback.overallComment && (
            <Card>
              <h3 className="font-bold text-brand-ink mb-2">💬 총평</h3>
              <p className="text-sm text-brand-gray-700 leading-relaxed">
                {feedback.overallComment}
              </p>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {feedback.strengths.length > 0 && (
              <Card>
                <h3 className="font-bold text-brand-ink mb-2 flex items-center gap-2">
                  <span className="text-green-600">✓</span> 잘한 점
                </h3>
                <ul className="space-y-1.5 text-sm text-brand-gray-700">
                  {feedback.strengths.map((s, i) => (
                    <li key={i} className="leading-relaxed">• {s}</li>
                  ))}
                </ul>
              </Card>
            )}
            {feedback.improvements.length > 0 && (
              <Card>
                <h3 className="font-bold text-brand-ink mb-2 flex items-center gap-2">
                  <span className="text-brand-red">!</span> 개선 포인트
                </h3>
                <ul className="space-y-1.5 text-sm text-brand-gray-700">
                  {feedback.improvements.map((s, i) => (
                    <li key={i} className="leading-relaxed">• {s}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {metrics && (
            <Card>
              <h3 className="font-bold text-brand-ink mb-3">⏱ 발화 지표</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Metric label="단어 수" value={`${metrics.wordCount}`} />
                <Metric label="문장 수" value={`${metrics.sentenceCount}`} />
                <Metric
                  label="발화 시간"
                  value={metrics.speakingSec ? `${Math.round(metrics.speakingSec)}초` : "—"}
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── 모범 답안 ── */}
      {tab === "model" && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold text-brand-ink mb-1">
              ⭐ 목표 등급({targetLevel}) 모범 답안
            </h3>
            <p className="text-xs text-brand-gray-500 mb-3">
              같은 질문을 목표 등급 수준으로 답하면 이렇게 됩니다.
            </p>
            <p className="text-sm text-brand-gray-800 leading-relaxed bg-brand-blue/5 border border-brand-blue/20 p-4 rounded-xl whitespace-pre-wrap">
              {feedback.modelAnswer || sampleAnswer}
            </p>
          </Card>

          {sampleAnswer && feedback.modelAnswer && sampleAnswer !== feedback.modelAnswer && (
            <Card>
              <h3 className="font-bold text-brand-ink mb-2">📗 문항 기본 예시 답안</h3>
              <p className="text-sm text-brand-gray-700 leading-relaxed bg-brand-gray-50 p-4 rounded-xl whitespace-pre-wrap">
                {sampleAnswer}
              </p>
            </Card>
          )}
        </div>
      )}

      <Card>
        <button
          onClick={onRestart}
          className="w-full py-3 bg-brand-navy text-white font-bold rounded-xl hover:bg-brand-navy-dark transition-colors"
        >
          다시 답변하기
        </button>
      </Card>
    </div>
  );
}

/** NL → AL 사다리에서 현재 위치와 목표를 함께 보여준다 */
function GradeLadder({ current, target }: { current: Level; target: Level }) {
  const all: Level[] = ["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"];
  const ci = gradeIndex(current);
  const ti = gradeIndex(target);
  return (
    <div className="mt-5 flex gap-1">
      {all.map((g, i) => {
        const isCurrent = i === ci;
        const isTarget = i === ti;
        const filled = i <= ci;
        return (
          <div key={g} className="flex-1 text-center">
            <div
              className={`h-1.5 rounded-full ${
                filled ? "bg-brand-navy" : "bg-brand-gray-200"
              }`}
            />
            <div
              className={`text-[10px] mt-1 font-bold ${
                isCurrent
                  ? "text-brand-navy"
                  : isTarget
                  ? "text-brand-red"
                  : "text-brand-gray-300"
              }`}
            >
              {isCurrent || isTarget ? g : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-brand-gray-50 rounded-xl">
      <div className="text-lg font-black text-brand-navy">{value}</div>
      <div className="text-[11px] text-brand-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
