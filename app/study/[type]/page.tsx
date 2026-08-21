"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { OpicQuestion, QuestionType } from "@/types";
import { storage } from "@/lib/storage";
import { filterByTargetLevel } from "@/lib/levelFilter";
import { QUESTION_TYPES, TYPE_META, getQuestions } from "@/lib/questions";
import StudySession from "@/components/study/StudySession";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";

export default function StudyPage() {
  const params = useParams<{ type: string }>();
  const type = Number(params?.type) as QuestionType;
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!storage.isSetupComplete()) {
      router.push("/setup");
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted || !QUESTION_TYPES.includes(type)) return null;

  const meta = TYPE_META[type];
  const target = storage.getSettings().targetLevel;
  // 자기소개는 실제 시험에서 등급과 무관하게 모두에게 첫 문항으로 나온다.
  // 난이도 필터를 태우면 목표 등급이 높을 때 자기소개가 빠지므로 제외한다.
  const items =
    type === 1 ? getQuestions(1) : filterByTargetLevel(getQuestions(type), target);
  const current = items[currentIdx % items.length];

  if (!current) return null;

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-xs text-brand-gray-600 hover:text-brand-navy mb-1 inline-block"
            >
              ← 대시보드
            </Link>
            <h1 className="text-2xl font-bold text-brand-gray-900">
              {meta.icon} 유형 {type}. {meta.name}
            </h1>
            <p className="text-sm text-brand-gray-600">{meta.description}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-brand-gray-500">진행</div>
            <div className="text-lg font-bold text-brand-navy">
              {(currentIdx % items.length) + 1} / {items.length}
            </div>
          </div>
        </div>

        <QuestionMeta item={current} />

        <StudySession
          key={current.id}
          type={type}
          questionId={current.id}
          question={current.question}
          sampleAnswer={current.sample_answer}
        />

        <div className="mt-6 flex justify-between">
          <Button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            variant="secondary"
            disabled={currentIdx === 0}
          >
            ← 이전 문제
          </Button>
          <Button onClick={() => setCurrentIdx((i) => i + 1)}>다음 문제 →</Button>
        </div>
      </main>
    </>
  );
}

/** 문항 위에 붙는 주제·콤보 단계 표시와 롤플레이 상황 안내 */
function QuestionMeta({ item }: { item: OpicQuestion }) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-navy/10 text-brand-navy">
          {item.category}
        </span>
        {item.combo && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-blue/10 text-brand-blue">
            {item.combo}
          </span>
        )}
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-gray-100 text-brand-gray-600">
          {item.difficulty === "easy"
            ? "쉬움"
            : item.difficulty === "medium"
            ? "보통"
            : "어려움"}
        </span>
      </div>

      {item.situation && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="text-[10px] font-black tracking-wider text-amber-700 mb-1">
            🎭 주어진 상황
          </div>
          <p className="text-sm text-brand-ink leading-relaxed">{item.situation}</p>
        </div>
      )}
    </div>
  );
}
