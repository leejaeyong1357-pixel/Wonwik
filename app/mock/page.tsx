"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import mockExams from "@/data/mock_exams.json";
import type { MockExamResult } from "@/types";

const GROUPS = [
  {
    key: "easy",
    title: "기초 (Lv 4~5)",
    desc: "35~64점 목표 — 기본 비즈니스 의사소통 단계",
  },
  {
    key: "medium",
    title: "중급 (Lv 5~6)",
    desc: "50~74점 목표 — 해외 주재원 최소 기준",
  },
  {
    key: "hard",
    title: "고급 (Lv 7~8)",
    desc: "75~96점 목표 — 유창한 비즈니스 영어 / 승진 우대",
  },
] as const;

export default function MockListPage() {
  const router = useRouter();
  const [results, setResults] = useState<MockExamResult[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!storage.isSetupComplete()) {
      router.push("/setup");
      return;
    }
    setResults(storage.getMockResults());
    setMounted(true);
  }, [router]);

  if (!mounted) return null;

  const exams = mockExams.exams as any[];
  const buckets: Record<string, any[]> = {
    easy: exams.filter((e) => e.difficulty === "easy"),
    medium: exams.filter((e) => e.difficulty === "medium"),
    hard: exams.filter((e) => e.difficulty === "hard"),
  };

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/dashboard" className="text-xs text-brand-gray-600 hover:text-brand-navy mb-1 inline-block">
            ← 대시보드
          </Link>
          <h1 className="text-3xl font-bold text-brand-gray-900 mb-1">모의고사</h1>
          <p className="text-brand-gray-600">
            실제 시험과 동일한 13분, 4가지 유형 연속 진행. 점수대별 50회 준비.
          </p>
        </div>

        {results.length > 0 && (
          <Card className="mb-6">
            <h2 className="font-bold text-brand-gray-900 mb-3">최근 모의고사 결과</h2>
            <div className="space-y-2">
              {results
                .slice(-5)
                .reverse()
                .map((r, i) => {
                  const exam = exams.find((e) => e.id === r.examId);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm p-2 hover:bg-brand-gray-50 rounded"
                    >
                      <span className="text-brand-gray-700">{exam?.title || r.examId}</span>
                      <span className="font-bold text-brand-navy">
                        Lv {r.estimatedLevel} ({r.totalScore}점)
                      </span>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}

        {GROUPS.map((g) => (
          <div key={g.key} className="mb-8">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-brand-gray-900">{g.title}</h2>
              <p className="text-xs text-brand-gray-500">{g.desc} · {buckets[g.key].length}회</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {buckets[g.key].map((exam: any) => {
                const done = results.some((r) => r.examId === exam.id);
                const doneResult = results.find((r) => r.examId === exam.id);
                return (
                  <Link key={exam.id} href={`/mock/${exam.id}`}>
                    <Card className="hover:border-brand-navy cursor-pointer transition-colors h-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-brand-navy text-lg">
                          {exam.title}
                        </span>
                        {done && <span className="text-xs text-green-600">✓</span>}
                      </div>
                      <div className="text-xs text-brand-gray-500 mb-2">
                        {exam.topics?.slice(0, 2).join(" · ")}
                      </div>
                      <div className="text-xs text-brand-gray-600">
                        목표: {exam.target_score_range || exam.target_score}
                      </div>
                      {done && doneResult && (
                        <div className="text-xs text-brand-red font-semibold mt-1">
                          {doneResult.totalScore}점
                        </div>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
