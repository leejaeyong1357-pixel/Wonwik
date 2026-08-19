"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen bg-white text-brand-ink overflow-x-hidden">
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all ${
          scrolled ? "bg-white/95 backdrop-blur shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/brand-logo.svg" alt="WONIK HOLDINGS" width={148} height={34} className="h-8 w-auto" />
            <span className="text-brand-gray-300">|</span>
            <span className="font-brand text-lg text-brand-navy tracking-tight">Wonpic</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/signup"
              className="px-4 py-2 bg-brand-blue text-white text-sm font-bold rounded-full hover:bg-blue-700 transition-colors"
            >
              등록하기
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 border border-brand-gray-300 text-brand-ink text-sm font-bold rounded-full hover:border-brand-navy hover:text-brand-navy transition-colors"
            >
              로그인 →
            </Link>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-br from-white via-brand-gray-50 to-blue-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center animate-fadeup">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-red/10 text-brand-red text-xs font-bold rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
              원익 임직원 전용 · OPIc 학습 플랫폼
            </div>
            <h1 className="hero-headline text-5xl md:text-7xl text-brand-ink mb-6">
              OPIc, AI가 끌어올린다.
              <br />
              <span className="text-brand-navy">Wonpic</span>.
            </h1>
            <p className="text-lg md:text-xl text-brand-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              자기소개부터 롤플레이·고난도까지.
              <br />
              AI 채점, 음성 인식, 맞춤 모범답안으로
              <br />
              <span className="font-bold text-brand-ink">IM2 에서 IH 로</span>.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/signup"
                className="px-8 py-4 bg-brand-navy text-white font-bold rounded-full hover:bg-brand-navy-dark transition-all hover:shadow-xl"
              >
                등록하고 시작하기 →
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 border-2 border-brand-navy text-brand-navy font-bold rounded-full hover:bg-brand-navy hover:text-white transition-colors"
              >
                로그인
              </Link>
              <a
                href="#features"
                className="px-8 py-4 border-2 border-brand-gray-300 text-brand-gray-700 font-bold rounded-full hover:border-brand-navy hover:text-brand-navy transition-colors"
              >
                알아보기
              </a>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                ["100제", "유형별 실전 문항"],
                ["15문항", "실전 모의고사"],
                ["9등급", "NL ~ AL 판정"],
              ].map(([n, l]) => (
                <div key={l} className="text-center">
                  <div className="font-brand text-3xl md:text-4xl text-brand-navy">{n}</div>
                  <div className="text-xs text-brand-gray-500 mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-bold text-brand-red mb-3">FEATURES</div>
            <h2 className="hero-headline text-4xl md:text-5xl text-brand-ink">
              Wonpic의 기능
            </h2>
            <p className="text-brand-gray-600 mt-3">
              학습부터 채점까지, 한 화면에서 끝내세요.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                t: "AI 엄격 채점",
                d: "과제수행·유창성·어휘·문장구성·전달력 5개 영역 진단 후 NL~AL 예상 등급 산정.",
                emoji: "🎯",
              },
              {
                t: "음성 인식 답변",
                d: "Web Speech API로 실시간 영어 음성 → 텍스트 변환. 입력 답변도 OK.",
                emoji: "🎤",
              },
              {
                t: "단어 호버 번역",
                d: "영어 단어 위에 마우스 → 우측에 한글 의미. 학습 흐름 유지.",
                emoji: "📖",
              },
              {
                t: "맞춤 모범답안",
                d: "목표 등급(IL~AL)에 맞춘 모범답안 생성. 너무 어렵지도, 쉽지도 않게.",
                emoji: "⭐",
              },
              {
                t: "실전 모의고사",
                d: "실제 OPIc 과 같은 15문항 구성. 등급대별 10회 세트, 종합 등급 즉시 산정.",
                emoji: "⏱️",
              },
              {
                t: "학습 통계",
                d: "유형별 강약점, 점수 추이, 모의고사 히스토리. 시험까지 D-day 카운트.",
                emoji: "📊",
              },
            ].map((f) => (
              <div
                key={f.t}
                className="p-6 rounded-2xl border border-brand-gray-200 hover:border-brand-navy hover:shadow-lg transition-all"
              >
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="font-bold text-lg text-brand-ink mb-2">{f.t}</h3>
                <p className="text-sm text-brand-gray-600 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-brand-navy text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-sm font-bold text-red-400 mb-3 tracking-wider">BRAND STORY</div>
          <h2 className="hero-headline text-4xl md:text-5xl mb-8">
            한국 사람들은 왜 영어를
            <br />
            몇 십년씩 배워도 말하기를 어려워할까?
          </h2>
          <p className="text-blue-100 text-base md:text-lg leading-relaxed">
            읽고 쓰는 건 되는데, 막상 입을 열면 한 문장에서 멈춥니다.
            <br />
            OPIc 은 정답을 맞히는 시험이 아니라, 얼마나 길게 자연스럽게
            <br />
            말할 수 있는지를 보는 시험입니다.
            <br />
            <br />
            <span className="text-white font-bold">Wonpic</span>은 그 순간을 위해 만들어졌습니다.
            <br />
            언제 어디서든 실전처럼 말하고, AI가 바로 진단합니다.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="hero-headline text-4xl md:text-5xl text-brand-ink mb-6">
            준비되셨나요?
          </h2>
          <p className="text-brand-gray-600 mb-8 text-lg">
            처음이라면 <b>등록하기</b>, 이미 등록했다면 <b>로그인</b>.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/signup"
              className="inline-block px-10 py-4 bg-brand-red text-white font-bold rounded-full hover:bg-brand-red-dark transition-all hover:shadow-xl text-lg"
            >
              등록하기 →
            </Link>
            <Link
              href="/login"
              className="inline-block px-10 py-4 border-2 border-brand-ink text-brand-ink font-bold rounded-full hover:bg-brand-ink hover:text-white transition-colors text-lg"
            >
              로그인
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 bg-brand-gray-50 border-t border-brand-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-brand-gray-500">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Image src="/brand-logo.svg" alt="WONIK HOLDINGS" width={110} height={26} className="h-6 w-auto opacity-70" />
              <span>© WONIK · our group</span>
            </div>
            <div className="text-[10px] text-brand-gray-400 ml-1">
              made by 운영 담당자
            </div>
          </div>
          <div>Wonpic v0.3</div>
        </div>
      </footer>
    </main>
  );
}
