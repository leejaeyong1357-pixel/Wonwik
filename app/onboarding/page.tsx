"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { pushUserToServer } from "@/lib/userSync";
import Button from "@/components/ui/Button";

const SECTIONS = [
  {
    badge: "OPIc 이란?",
    title: "Oral Proficiency Interview - computer",
    body: (
      <>
        <p className="text-brand-gray-700 leading-relaxed">
          컴퓨터로 진행하는 영어 말하기 평가입니다. 정해진 정답을 맞히는 시험이 아니라,
          <br />
          <b>얼마나 자연스럽게 오래 말할 수 있는가</b>를 ACTFL 기준으로 판정합니다.
        </p>
        <div className="mt-4 p-4 bg-brand-blue/5 border border-brand-blue/20 rounded-xl">
          <div className="font-bold text-brand-blue mb-1">💡 핵심 포인트</div>
          <ul className="text-sm text-brand-gray-800 space-y-1">
            <li>• 시험 시작 전 <b>배경 설문</b>으로 본인이 답할 주제를 직접 고릅니다</li>
            <li>• 총 15문항, 약 40분. 문항당 정해진 시간 제한은 없습니다</li>
            <li>• 짧고 완벽한 문장보다 <b>길고 자연스러운 답변</b>이 유리합니다</li>
          </ul>
        </div>
      </>
    ),
  },
  {
    badge: "출제 유형",
    title: "5가지 유형 · 총 15문항",
    body: (
      <div className="space-y-3">
        {[
          {
            n: 1,
            name: "자기소개",
            desc: "본인·직장·거주지·가족 소개 (첫 문항 고정)",
            time: "1문항",
          },
          {
            n: 2,
            name: "설문 주제",
            desc: "배경 설문에서 고른 주제. 묘사 → 습관 → 경험 콤보",
            time: "약 6문항",
          },
          {
            n: 3,
            name: "돌발 주제",
            desc: "설문에 없어도 나오는 공통 주제 (날씨·교통·은행 등)",
            time: "약 3문항",
          },
          {
            n: 4,
            name: "롤플레이",
            desc: "상황을 주고 질문하기 · 문제 해결 요구",
            time: "약 3문항",
          },
          {
            n: 5,
            name: "고난도",
            desc: "과거·현재 비교, 사회 이슈 분석 (IH·AL 목표 시)",
            time: "약 2문항",
          },
        ].map((t) => (
          <div key={t.n} className="flex items-start gap-3 p-3 bg-brand-gray-50 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-brand-navy text-white font-bold flex items-center justify-center shrink-0">
              {t.n}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-brand-ink">{t.name}</span>
                <span className="text-xs text-brand-gray-500">{t.time}</span>
              </div>
              <p className="text-sm text-brand-gray-700 mt-0.5">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    badge: "등급 체계",
    title: "9등급 · NL 부터 AL 까지",
    body: (
      <div className="space-y-2">
        {[
          ["NL", "Novice Low", "단어 나열 수준", "bg-brand-gray-100"],
          ["NM", "Novice Mid", "암기한 짧은 문장", "bg-brand-gray-100"],
          ["NH", "Novice High", "익숙한 주제 단문", "bg-brand-gray-100"],
          ["IL", "Intermediate Low", "문장을 이어서 말함", "bg-blue-50"],
          ["IM1", "Intermediate Mid 1", "문단 수준 답변", "bg-blue-50"],
          ["IM2", "Intermediate Mid 2", "사무직 지원 최소 구간", "bg-blue-100"],
          ["IM3", "Intermediate Mid 3", "사무직 일반 요구 구간", "bg-blue-100"],
          ["IH", "Intermediate High", "주요 기업·공공기관 선호", "bg-blue-200"],
          ["AL", "Advanced Low", "해외 업무·주재원 구간", "bg-blue-300"],
        ].map(([lv, name, desc, bg]) => (
          <div key={lv} className={`flex items-center gap-3 p-2.5 rounded-lg ${bg}`}>
            <div className="font-bold text-brand-navy w-12">{lv}</div>
            <div className="text-xs font-mono text-brand-gray-700 w-36 hidden sm:block">{name}</div>
            <div className="text-sm text-brand-gray-800 flex-1">{desc}</div>
          </div>
        ))}
        <p className="text-[11px] text-brand-gray-500 pt-2 leading-relaxed">
          ※ 실제 OPIc 은 총점을 매기지 않습니다. Wonpic 은 학습 진척을 보기 위해 5개 영역을
          100점으로 환산해 예상 등급을 보여줄 뿐, 공식 점수가 아닙니다.
        </p>
      </div>
    ),
  },
];


export default function OnboardingPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!storage.isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) return null;

  const isLast = idx === SECTIONS.length - 1;
  const section = SECTIONS[idx];

  const finish = (skipForever: boolean) => {
    const settings = storage.getSettings();
    storage.saveSettings({
      ...settings,
      onboardingSeen: true,
      onboardingSkipForever: skipForever,
    });
    pushUserToServer();
    if (!settings.setupCompleted) {
      router.push("/setup");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="font-brand text-2xl text-brand-navy mb-1">Wonpic</div>
          <div className="text-sm text-brand-gray-500">시작하기 전에 꼭 확인하세요</div>
        </div>

        <div className="bg-white rounded-3xl border border-brand-gray-200 shadow-lg p-8 mb-4">
          <div className="flex items-center gap-2 mb-2">
            {SECTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === idx ? "w-8 bg-brand-navy" : i < idx ? "w-4 bg-brand-navy/30" : "w-4 bg-brand-gray-200"
                }`}
              />
            ))}
            <span className="ml-auto text-xs text-brand-gray-500">{idx + 1} / {SECTIONS.length}</span>
          </div>

          <div className="text-xs font-bold text-brand-red mb-1">{section.badge}</div>
          <h2 className="text-2xl font-bold text-brand-ink mb-4">{section.title}</h2>
          <div>{section.body}</div>

          <div className="mt-8 flex items-center justify-between gap-3">
            {idx > 0 ? (
              <Button onClick={() => setIdx(idx - 1)} variant="ghost">← 이전</Button>
            ) : (
              <div />
            )}
            {isLast ? (
              <div className="flex gap-2">
                <Button onClick={() => finish(true)} variant="outline" size="sm">
                  다시 보지 않기
                </Button>
                <Button onClick={() => finish(false)}>확인했습니다 →</Button>
              </div>
            ) : (
              <Button onClick={() => setIdx(idx + 1)}>다음 →</Button>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-brand-gray-500">
          나중에 설정 메뉴에서 다시 볼 수 있습니다.
        </div>
      </div>
    </main>
  );
}
