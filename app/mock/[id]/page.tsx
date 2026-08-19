"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTTS, useSTT } from "@/lib/speech";
import { storage } from "@/lib/storage";
import { pushUserToServer } from "@/lib/userSync";
import { getFeedback } from "@/lib/ai";
import { scoreToLevel } from "@/lib/scoring";
import { TYPE_META, findMockExam, getMockQuestions } from "@/lib/questions";
import type { AiFeedback, MockExamAnswer } from "@/types";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Timer from "@/components/ui/Timer";
import MockSummary from "@/components/mock/MockSummary";

/** 문항당 답변 제한 시간 (초). 실제 OPIc 과 비슷하게 2분 */
const QUESTION_SECONDS = 120;

export default function MockExamPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const router = useRouter();

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<number, AiFeedback>>({});
  const [phase, setPhase] = useState<"intro" | "answering" | "scoring" | "done">("intro");
  const [startedAt, setStartedAt] = useState(0);
  const [editedAnswer, setEditedAnswer] = useState("");

  const { speak, stop: stopTTS, speaking } = useTTS();
  const {
    listening,
    transcript,
    interimTranscript,
    start: startSTTRaw,
    stop: stopSTT,
    reset: resetSTT,
  } = useSTT();
  const baseAnswerRef = useRef("");

  const startSTT = () => {
    baseAnswerRef.current = editedAnswer.trim();
    startSTTRaw();
  };

  const exam = findMockExam(id);

  useEffect(() => {
    if (!storage.isSetupComplete()) router.push("/setup");
  }, [router]);

  useEffect(() => {
    if (!listening) return;
    const live = (transcript + " " + interimTranscript).trim();
    const base = baseAnswerRef.current;
    setEditedAnswer(base ? (live ? base + " " + live : base) : live);
  }, [transcript, interimTranscript, listening]);

  if (!exam) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto p-6">
          <Card>모의고사를 찾을 수 없습니다.</Card>
        </main>
      </>
    );
  }

  const questions = getMockQuestions(exam);
  const total = questions.length;
  const current = questions[idx];

  const collect = (): MockExamAnswer[] =>
    questions.map((q, i) => ({
      questionId: q.id,
      type: q.type,
      answer: answers[i] || "",
      feedback: feedbacks[i],
    }));

  const averageScore = () => {
    const values = Object.values(feedbacks).map((f) => f.scoreEstimate);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const start = () => {
    setPhase("answering");
    setStartedAt(Date.now());
    setIdx(0);
  };

  const goNext = () => {
    stopSTT();
    stopTTS();
    if (!editedAnswer.trim() && !confirm("답변이 비어있습니다. 다음 문항으로 넘어갈까요?")) {
      return;
    }

    const answerText = editedAnswer;
    const questionIdx = idx;
    setAnswers((prev) => ({ ...prev, [questionIdx]: answerText }));

    const settings = storage.getSettings();
    const q = questions[questionIdx];
    if (q) {
      // 채점은 백그라운드로 — 응시자는 기다리지 않고 다음 문항으로 넘어간다
      getFeedback(
        {
          type: q.type,
          question: q.question,
          userAnswer: answerText,
          sampleAnswer: q.sample_answer,
          targetLevel: settings.targetLevel,
          context: q.situation,
        },
        { model: settings.aiModel },
      ).then((fb) => {
        setFeedbacks((prev) => ({ ...prev, [questionIdx]: fb }));
      });
    }

    resetSTT();
    setEditedAnswer("");

    if (questionIdx < total - 1) {
      setIdx(questionIdx + 1);
    } else {
      setPhase("scoring");
    }
  };

  const finalize = () => {
    const totalScore = averageScore();
    storage.addMockResult({
      examId: exam.id,
      startedAt,
      finishedAt: Date.now(),
      answers: collect(),
      totalScore,
      estimatedLevel: scoreToLevel(totalScore),
    });
    pushUserToServer();
    setPhase("done");
  };

  if (phase === "intro") {
    return (
      <>
        <Header />
        <main className="max-w-3xl mx-auto p-6">
          <Card>
            <h1 className="text-2xl font-bold text-brand-gray-900 mb-1">{exam.title}</h1>
            <p className="text-sm text-brand-gray-600 mb-6">
              목표 등급 {exam.targetGrade} 기준 · {total}문항
            </p>

            <h2 className="font-bold text-brand-gray-900 mb-2">시험 안내</h2>
            <ul className="space-y-1.5 text-sm text-brand-gray-700 mb-6">
              <li>• 실제 OPIc 과 같은 {total}문항 구성입니다</li>
              <li>• 자기소개 → 설문 콤보 → 돌발 콤보 → 설문 콤보 → 롤플레이 → 고난도 순서</li>
              <li>• 문항당 {QUESTION_SECONDS / 60}분. 시간이 지나면 자동으로 넘어갑니다</li>
              <li>• 음성으로 답변하거나(마이크 권한 필요) 직접 입력할 수 있습니다</li>
              <li>• 이전 문항으로 돌아갈 수 없습니다 (실제 시험과 동일)</li>
              <li>• 채점은 답변할 때마다 백그라운드로 진행되고, 마지막에 종합 결과가 나옵니다</li>
            </ul>

            <div className="flex gap-2">
              <Button onClick={start}>시험 시작 →</Button>
              <Link href="/mock">
                <Button variant="ghost">취소</Button>
              </Link>
            </div>
          </Card>
        </main>
      </>
    );
  }

  if (phase === "done") {
    return (
      <>
        <Header />
        <MockSummary
          totalScore={averageScore()}
          answers={collect()}
          durationMs={startedAt ? Date.now() - startedAt : undefined}
        />
      </>
    );
  }

  if (phase === "scoring") {
    const graded = Object.keys(feedbacks).length;
    const ready = graded >= total;
    return (
      <>
        <Header />
        <main className="max-w-3xl mx-auto p-6">
          <Card className="text-center py-12">
            {ready ? (
              <>
                <div className="text-4xl mb-3">📊</div>
                <h1 className="text-2xl font-bold text-brand-gray-900 mb-3">채점 완료</h1>
                <Button onClick={finalize}>결과 확인 →</Button>
              </>
            ) : (
              <>
                <div className="inline-block w-12 h-12 border-4 border-brand-navy border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-brand-gray-700">AI가 답변을 채점하고 있어요...</p>
                <p className="text-xs text-brand-gray-500 mt-2">
                  완료: {graded} / {total}
                </p>
                <div className="mt-5">
                  <Button onClick={finalize} variant="ghost" size="sm">
                    채점된 문항만으로 결과 보기
                  </Button>
                </div>
              </>
            )}
          </Card>
        </main>
      </>
    );
  }

  if (!current) return null;
  const meta = TYPE_META[current.type];

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-brand-gray-500">{exam.title}</div>
            <h1 className="text-xl font-bold text-brand-gray-900">
              {meta.icon} {meta.name}{" "}
              <span className="text-sm font-normal text-brand-gray-500">
                {idx + 1} / {total}
              </span>
            </h1>
          </div>
          <Timer
            seconds={QUESTION_SECONDS}
            onExpire={goNext}
            autoStart
            label="남은 시간"
            key={idx}
          />
        </div>

        <div className="w-full bg-brand-gray-100 h-1 rounded mb-4 overflow-hidden">
          <div
            className="bg-brand-navy h-1 transition-all"
            style={{ width: `${(idx / total) * 100}%` }}
          />
        </div>

        {current.situation && (
          <Card className="mb-4">
            <div className="text-[10px] font-black tracking-wider text-amber-700 mb-1">
              🎭 주어진 상황
            </div>
            <p className="text-sm text-brand-ink leading-relaxed">{current.situation}</p>
          </Card>
        )}

        <Card className="mb-4">
          <div className="mb-3 p-3 bg-brand-blue/10 border-l-4 border-brand-blue rounded-r-xl flex items-start gap-2">
            <span className="text-xl leading-none">📌</span>
            <div>
              <div className="text-xs font-bold text-brand-blue mb-0.5">미션</div>
              <div className="text-sm font-semibold text-brand-ink leading-snug">
                {meta.description}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-red">QUESTION</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-gray-100 text-brand-gray-600">
              {current.category}
            </span>
            {current.combo && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">
                {current.combo}
              </span>
            )}
          </div>
          <p className="text-lg font-semibold text-brand-gray-900 leading-relaxed mb-3">
            {current.question}
          </p>
          <Button
            onClick={() => (speaking ? stopTTS() : speak(current.question, { rate: 0.95 }))}
            variant={speaking ? "danger" : "primary"}
            size="sm"
          >
            {speaking ? "■ 정지" : "▶ 듣기"}
          </Button>
        </Card>

        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-brand-red">YOUR ANSWER</div>
            <Button
              onClick={listening ? stopSTT : startSTT}
              variant={listening ? "danger" : "primary"}
              size="sm"
            >
              {listening ? "● 녹음 정지" : "🎤 음성 답변"}
            </Button>
          </div>
          <textarea
            value={editedAnswer}
            onChange={(e) => setEditedAnswer(e.target.value)}
            placeholder="영어로 답변하세요."
            className="w-full min-h-[140px] border border-brand-gray-300 rounded-xl p-4 text-sm focus:outline-none focus:border-brand-navy"
          />
        </Card>

        <div className="flex justify-end">
          <Button onClick={goNext}>
            {idx === total - 1 ? "시험 종료 →" : "다음 문항 →"}
          </Button>
        </div>
      </main>
    </>
  );
}
