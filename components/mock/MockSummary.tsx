"use client";

import { useState } from "react";
import Link from "next/link";
import type { AiFeedback, MockExamAnswer, QuestionType, ScoreCriteria } from "@/types";
import { levelLabel, scoreToLevel } from "@/lib/scoring";
import { QUESTION_TYPES, TYPE_META, findQuestion } from "@/lib/questions";
import { storage } from "@/lib/storage";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ResultSheet from "@/components/dashboard/ResultSheet";

const AREA_ROWS: { key: keyof ScoreCriteria; label: string }[] = [
  { key: "taskCompletion", label: "과제 수행" },
  { key: "fluency", label: "유창성" },
  { key: "vocabulary", label: "어휘력" },
  { key: "grammar", label: "문장 구성" },
  { key: "delivery", label: "전달력" },
];

interface Props {
  totalScore: number;
  answers: MockExamAnswer[];
  durationMs?: number;
}

export default function MockSummary({ totalScore, answers, durationMs }: Props) {
  const [activeTab, setActiveTab] = useState<"report" | "summary" | QuestionType>("report");
  const session = storage.getSession();

  const graded = answers.filter((a) => a.feedback);
  const allFeedbacks = graded.map((a) => a.feedback!) as AiFeedback[];

  const criteriaAvg: ScoreCriteria = {
    taskCompletion: avg(allFeedbacks.map((f) => f.criteria?.taskCompletion ?? 0)),
    fluency: avg(allFeedbacks.map((f) => f.criteria?.fluency ?? 0)),
    vocabulary: avg(allFeedbacks.map((f) => f.criteria?.vocabulary ?? 0)),
    grammar: avg(allFeedbacks.map((f) => f.criteria?.grammar ?? 0)),
    delivery: avg(allFeedbacks.map((f) => f.criteria?.delivery ?? 0)),
  };

  /** 유형별 평균 점수 — 한 유형에 여러 문항이 배정되므로 평균으로 집계 */
  const typeScores = QUESTION_TYPES.map((t) => {
    const rows = graded.filter((a) => a.type === t);
    return {
      type: t,
      count: rows.length,
      score: Math.round(avg(rows.map((r) => r.feedback!.scoreEstimate))),
    };
  }).filter((r) => r.count > 0);

  const ranked = [...typeScores].sort((a, b) => b.score - a.score);
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];

  const allStrengths = allFeedbacks.flatMap((f) => f.strengths || []).slice(0, 6);
  const allImprovements = allFeedbacks.flatMap((f) => f.improvements || []).slice(0, 6);

  const tabBtn = (id: typeof activeTab, label: string) => (
    <button
      key={String(id)}
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-colors ${
        activeTab === id
          ? "bg-brand-blue text-white"
          : "bg-white border border-brand-gray-200 text-brand-gray-700 hover:border-brand-blue hover:text-brand-blue"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="text-xs font-bold text-brand-red mb-1">모의고사 결과</div>
            <h1 className="text-2xl font-black text-brand-ink">📊 종합 분석</h1>
            <div className="text-xs text-brand-gray-500 mt-1">
              {graded.length}문항 채점 완료
              {durationMs ? ` · 소요 시간 ${Math.round(durationMs / 60000)}분` : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-brand-gray-500">예상 등급</div>
            <div className="text-5xl font-black text-brand-navy leading-none">
              {scoreToLevel(totalScore)}
            </div>
            <div className="mt-2 inline-block px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-bold">
              환산 {totalScore} / 100
            </div>
          </div>
        </div>
        <div className="w-full bg-brand-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-blue to-brand-navy h-3 transition-all"
            style={{ width: `${totalScore}%` }}
          />
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabBtn("report", "📄 결과지")}
        {tabBtn("summary", "📋 종합 분석")}
        {typeScores.map((r) => tabBtn(r.type, `${TYPE_META[r.type].name} · ${r.score}`))}
      </div>

      {activeTab === "report" && (
        <ResultSheet
          data={{
            name: session?.name || "학습자",
            team: session?.team,
            date: new Date().toISOString().slice(0, 10),
            totalScore,
            level: scoreToLevel(totalScore),
            criteria: {
              taskCompletion: Math.round(criteriaAvg.taskCompletion),
              fluency: Math.round(criteriaAvg.fluency),
              vocabulary: Math.round(criteriaAvg.vocabulary),
              grammar: Math.round(criteriaAvg.grammar),
              delivery: Math.round(criteriaAvg.delivery),
            },
          }}
        />
      )}

      {activeTab === "summary" && (
        <div className="space-y-4">
          <Card>
            <h2 className="font-bold text-brand-ink mb-3">📊 유형별 평균</h2>
            <div className="space-y-3">
              {typeScores.map((r) => (
                <div key={r.type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-brand-ink">
                        {TYPE_META[r.type].icon} {TYPE_META[r.type].name}
                      </span>
                      <span className="text-xs text-brand-gray-500">{r.count}문항</span>
                    </div>
                    <div className="text-sm font-bold tabular-nums">
                      <span className="text-brand-blue">{r.score}</span>
                      <span className="text-brand-gray-400"> / 100</span>
                    </div>
                  </div>
                  <div className="w-full bg-brand-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-brand-blue h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.max(2, r.score)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {strongest && weakest && strongest.type !== weakest.type && (
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="text-xs font-bold text-green-800 mb-0.5">💪 가장 강한 유형</div>
                  <div className="text-sm font-bold text-brand-ink">
                    {TYPE_META[strongest.type].name} · {strongest.score}점
                  </div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-xs font-bold text-red-800 mb-0.5">📌 보강 필요</div>
                  <div className="text-sm font-bold text-brand-ink">
                    {TYPE_META[weakest.type].name} · {weakest.score}점
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-bold text-brand-ink mb-1">📐 평가 영역 평균</h2>
            <p className="text-xs text-brand-gray-500 mb-4">
              전체 문항 평균. 각 영역 20점 만점입니다.
            </p>
            <AreaBars criteria={criteriaAvg} />
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {allStrengths.length > 0 && (
              <Card>
                <h3 className="font-bold text-brand-ink mb-3 flex items-center gap-2">
                  <span className="text-green-600">✓</span> 잘한 점 (전체)
                </h3>
                <ul className="space-y-1.5 text-sm text-brand-gray-700">
                  {allStrengths.map((s, i) => (
                    <li key={i} className="leading-relaxed">• {s}</li>
                  ))}
                </ul>
              </Card>
            )}
            {allImprovements.length > 0 && (
              <Card>
                <h3 className="font-bold text-brand-ink mb-3 flex items-center gap-2">
                  <span className="text-brand-red">!</span> 개선 포인트 (전체)
                </h3>
                <ul className="space-y-1.5 text-sm text-brand-gray-700">
                  {allImprovements.map((s, i) => (
                    <li key={i} className="leading-relaxed">• {s}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          <Card>
            <div className="text-center text-sm text-brand-gray-600 mb-3">
              상단 탭에서 유형별 상세 피드백을 볼 수 있어요.
            </div>
            <Link href="/dashboard">
              <Button fullWidth>대시보드로</Button>
            </Link>
          </Card>
        </div>
      )}

      {QUESTION_TYPES.map(
        (t) =>
          activeTab === t && (
            <TypeDetail key={t} type={t} rows={graded.filter((a) => a.type === t)} />
          ),
      )}
    </main>
  );
}

function AreaBars({ criteria }: { criteria: ScoreCriteria }) {
  return (
    <div className="space-y-3">
      {AREA_ROWS.map((c) => {
        const v = Math.round(criteria[c.key] ?? 0);
        const pct = (v / 20) * 100;
        const color =
          pct >= 75
            ? "bg-green-500"
            : pct >= 50
            ? "bg-brand-blue"
            : pct >= 25
            ? "bg-amber-500"
            : "bg-brand-red";
        return (
          <div key={c.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-brand-ink">{c.label}</span>
              <span className="text-sm font-bold tabular-nums">
                <span className="text-brand-blue">{v}</span>
                <span className="text-brand-gray-400"> / 20</span>
              </span>
            </div>
            <div className="w-full bg-brand-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`${color} h-2.5 rounded-full transition-all`}
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TypeDetail({ type, rows }: { type: QuestionType; rows: MockExamAnswer[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <div className="py-8 text-center text-sm text-brand-gray-500">
          이 유형의 채점 결과를 찾을 수 없습니다.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row, idx) => {
        const fb = row.feedback!;
        const q = findQuestion(row.questionId);
        return (
          <div key={row.questionId + idx} className="space-y-3">
            <Card>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-xs font-bold text-brand-red mb-1">
                    {TYPE_META[type].icon} {TYPE_META[type].name} · {idx + 1}번째 문항
                  </div>
                  <p className="text-sm font-semibold text-brand-ink leading-snug">
                    {q?.question || row.questionId}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-3xl font-black text-brand-navy">{fb.scoreEstimate}</div>
                  <div className="text-xs text-brand-gray-500">/ 100</div>
                  <div className="mt-1 inline-block px-2 py-0.5 bg-brand-blue/10 text-brand-blue rounded-full text-xs font-bold">
                    {levelLabel(fb.estimatedLevel)}
                  </div>
                </div>
              </div>

              {row.answer && (
                <div className="mt-3">
                  <h3 className="text-xs font-bold text-brand-gray-500 mb-1.5">🗣 내 답변</h3>
                  <p className="text-sm text-brand-gray-700 leading-relaxed bg-brand-gray-50 p-4 rounded-xl whitespace-pre-wrap">
                    {row.answer}
                  </p>
                </div>
              )}

              {fb.criteria && (
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-brand-gray-500 mb-2">📐 영역별 점수</h3>
                  <AreaBars criteria={fb.criteria} />
                </div>
              )}
            </Card>

            <div className="grid md:grid-cols-2 gap-3">
              {fb.strengths.length > 0 && (
                <Card>
                  <h3 className="font-bold text-brand-ink mb-2 flex items-center gap-2">
                    <span className="text-green-600">✓</span> 잘한 점
                  </h3>
                  <ul className="space-y-1.5 text-sm text-brand-gray-700">
                    {fb.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </Card>
              )}
              {fb.improvements.length > 0 && (
                <Card>
                  <h3 className="font-bold text-brand-ink mb-2 flex items-center gap-2">
                    <span className="text-brand-red">!</span> 개선 포인트
                  </h3>
                  <ul className="space-y-1.5 text-sm text-brand-gray-700">
                    {fb.improvements.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            <Card>
              <h3 className="font-bold text-brand-ink mb-2">⭐ 모범 답안 (목표 등급 기준)</h3>
              <p className="text-sm text-brand-gray-700 leading-relaxed bg-brand-blue/5 border border-brand-blue/20 p-4 rounded-xl whitespace-pre-wrap">
                {fb.modelAnswer}
              </p>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
