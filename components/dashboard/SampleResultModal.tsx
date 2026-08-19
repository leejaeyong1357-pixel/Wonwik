"use client";

import Link from "next/link";
import ResultSheet from "./ResultSheet";

const SAMPLE = {
  name: "홍길동 (예시)",
  team: "샘플팀",
  date: "2026-06-02",
  totalScore: 68,
  level: 6 as 6,
  criteria: {
    pronunciation: 9,
    listening: 25,
    vocabulary: 8,
    grammar: 16,
    fluency: 10,
  },
};

export default function SampleResultModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-brand-gray-50 rounded-3xl max-w-4xl w-full my-8 p-2 md:p-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-10 h-10 bg-white text-brand-ink rounded-full shadow-lg hover:bg-brand-gray-100 text-xl flex items-center justify-center"
          aria-label="닫기"
        >
          ×
        </button>

        <div className="bg-gradient-to-br from-brand-blue/10 via-transparent to-brand-red/5 rounded-2xl p-4 md:p-6">
          <div className="text-center mb-4">
            <div className="inline-block px-3 py-1 bg-brand-red/10 text-brand-red text-[10px] font-bold tracking-[0.2em] rounded-full mb-2">
              📄 예시 결과지 (SAMPLE)
            </div>
            <h2 className="text-xl md:text-2xl font-black text-brand-ink">
              모의고사를 보면 <span className="text-brand-blue">이런 결과지</span>를 제공해드려요
            </h2>
            <p className="text-sm text-brand-gray-600 mt-2">
              SPA 96점 만점 · 영역별 점수 분석 · 맞춤 학습 추천
            </p>
          </div>

          <ResultSheet data={SAMPLE} />

          <div className="mt-5 flex flex-col md:flex-row gap-2 justify-center">
            <Link
              href="/mock"
              onClick={onClose}
              className="px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-center"
            >
              🎯 지금 모의고사 풀러 가기 →
            </Link>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white border-2 border-brand-gray-200 text-brand-gray-700 font-bold rounded-xl hover:border-brand-blue hover:text-brand-blue transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
