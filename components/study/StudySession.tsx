"use client";

import { useEffect, useRef, useState } from "react";
import { useTTS, useSTT } from "@/lib/speech";
import { storage } from "@/lib/storage";
import { pushFlame } from "@/lib/flameSync";
import { pushUserToServer } from "@/lib/userSync";
import { getFeedback, translateText } from "@/lib/ai";
import type { AiFeedback, QuestionType, SpeakingMetrics } from "@/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FeedbackPanel from "./FeedbackPanel";
import { HoverText, WordHoverProvider } from "./WordHover";

/** 유형별 미션 안내 — 실제 OPIc 에서 요구하는 행동 기준 */
const MISSION: Record<QuestionType, string> = {
  1: "본인·직장·거주지를 구체적으로 소개하세요. 이름과 직업만 말하고 끝내지 마세요.",
  2: "고른 주제를 묘사하고, 습관과 경험까지 이어서 말하세요. 60초 이상이 목표입니다.",
  3: "준비 없이 나오는 주제입니다. 멈추지 말고 아는 것부터 이어서 말하세요.",
  4: "설명하지 말고 직접 수행하세요. 질문이면 3~4개를 실제로 묻고, 문제 상황이면 대안을 제시하세요.",
  5: "입장을 먼저 정하고 근거를 붙이세요. 과거와 현재를 비교하면 등급이 올라갑니다.",
};

interface Props {
  type: QuestionType;
  questionId: string;
  question: string;
  followUps?: string[];
  sampleAnswer: string;
  visualContent?: React.ReactNode;
}

export default function StudySession({
  type,
  questionId,
  question,
  followUps = [],
  sampleAnswer,
  visualContent,
}: Props) {
  const { speak, stop: stopTTS, speaking } = useTTS();
  const {
    listening,
    transcript,
    interimTranscript,
    error: sttError,
    start: startSTTRaw,
    stop: stopSTTRaw,
    reset: resetSTT,
  } = useSTT();

  const [step, setStep] = useState<"intro" | "answer" | "feedback">("intro");
  // 콤보 진행 — 0 은 본 질문, 이후는 팔로업. 실제 OPIc 처럼 한 주제를 이어서 묻는다
  const [turnIdx, setTurnIdx] = useState(0);
  const [turns, setTurns] = useState<{ question: string; answer: string }[]>([]);
  const [editedAnswer, setEditedAnswer] = useState("");
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [showKorean, setShowKorean] = useState(false);
  const [translation, setTranslation] = useState<string>("");
  const [translating, setTranslating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  // 답변 세션 상태 (STT listening 과는 별개) — 60초 타이머는 이 상태에 묶임
  // STT 는 자동 재시작으로 침묵 후에도 실시간 인식 계속됨
  const [answering, setAnswering] = useState(false);
  const autoSubmitRef = useRef(false);
  const editedAnswerRef = useRef("");
  const baseAnswerRef = useRef("");
  // 발화 지표 측정용 — 답변 시작 시각 / 첫 발화 시각
  const answerStartRef = useRef(0);
  const firstWordRef = useRef(0);
  const [metrics, setMetrics] = useState<SpeakingMetrics | undefined>();

  // 이번 턴에 실제로 묻는 질문
  const currentQuestion = turnIdx === 0 ? question : followUps[turnIdx - 1] || question;
  const totalTurns = 1 + followUps.length;
  const isLastTurn = turnIdx >= totalTurns - 1;

  const startAnswering = () => {
    baseAnswerRef.current = editedAnswer.trim();
    answerStartRef.current = Date.now();
    firstWordRef.current = 0;
    setAnswering(true);
    startSTTRaw();
  };

  const stopAnsweringOnly = () => {
    setAnswering(false);
    stopSTTRaw();
  };

  useEffect(() => {
    editedAnswerRef.current = editedAnswer;
  }, [editedAnswer]);

  useEffect(() => {
    if (listening) {
      const live = (transcript + " " + interimTranscript).trim();
      // 첫 인식 단어가 나온 시점 기록 (응답 시간 산출용)
      if (live && !firstWordRef.current && answerStartRef.current) {
        firstWordRef.current = Date.now();
      }
      const base = baseAnswerRef.current;
      const combined = base ? (live ? base + " " + live : base) : live;
      setEditedAnswer(combined);
    }
  }, [transcript, interimTranscript, listening]);

  // 60초 타이머는 answering 에만 묶임 → STT 가 침묵으로 잠시 꺼져도 타이머는 계속
  useEffect(() => {
    if (!answering) return;
    setTimeLeft(60);
    autoSubmitRef.current = false;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          autoSubmitRef.current = true;
          stopSTTRaw();
          setAnswering(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answering]);

  const playQuestion = () => {
    speak(currentQuestion, { rate: 0.95 });
    setPlayCount((c) => c + 1);
  };

  const toggleKorean = async () => {
    if (showKorean) {
      setShowKorean(false);
      return;
    }
    if (translation) {
      setShowKorean(true);
      return;
    }
    setTranslating(true);
    const settings = storage.getSettings();
    const ko = await translateText(currentQuestion, { model: settings.aiModel });
    setTranslation(ko);
    setShowKorean(true);
    setTranslating(false);
  };

  /** 다음 팔로업으로 넘어간다 (채점하지 않음) */
  const goToNextTurn = (answer: string) => {
    setTurns((prev) => [...prev, { question: currentQuestion, answer }]);
    setTurnIdx((i) => i + 1);
    setEditedAnswer("");
    setPlayCount(0);
    setShowKorean(false);
    setTranslation("");
    setMetrics(undefined);
    resetSTT();
    stopTTS();
  };

  const submitAnswer = async () => {
    if (!editedAnswer.trim()) return;
    stopSTTRaw();
    setAnswering(false);

    // 아직 팔로업이 남았으면 채점하지 않고 다음 질문으로
    if (!isLastTurn) {
      goToNextTurn(editedAnswer);
      return;
    }

    // 발화 지표 확정 (음성으로 답한 경우에만 시간 지표가 의미 있음)
    const words = editedAnswer.trim().split(/\s+/).filter(Boolean);
    if (answerStartRef.current) {
      const elapsed = (Date.now() - answerStartRef.current) / 1000;
      setMetrics({
        responseSec: firstWordRef.current
          ? (firstWordRef.current - answerStartRef.current) / 1000
          : undefined,
        speakingSec: Math.min(60, elapsed),
        wordCount: words.length,
        sentenceCount: editedAnswer.split(/[.!?]+/).filter((s) => s.trim()).length,
        repeatedWords: 0,
      });
    }

    setLoadingFeedback(true);
    setStep("feedback");

    const allTurns = [...turns, { question: currentQuestion, answer: editedAnswer }];
    const combinedAnswer = allTurns
      .map((t) => t.answer)
      .filter(Boolean)
      .join(" ");

    const settings = storage.getSettings();
    const result = await getFeedback(
      {
        type,
        question,
        userAnswer: combinedAnswer,
        sampleAnswer,
        targetLevel: settings.targetLevel,
        turns: allTurns,
      },
      { model: settings.aiModel },
    );
    setFeedback(result);
    setLoadingFeedback(false);

    const recordId = `${questionId}_${Date.now()}`;
    storage.addRecord({
      id: recordId,
      questionId,
      type,
      userAnswer: combinedAnswer,
      feedback: result,
      score: result.scoreEstimate,
      bookmarked: false,
      createdAt: Date.now(),
    });
    // 학습으로 올라간 불꽃을 공용 랭킹에 반영 + 관리자 통계용 KV 동기화
    pushFlame();
    pushUserToServer();
  };

  useEffect(() => {
    // 60초 만료 시에만 autoSubmitRef.current=true 가 되어 자동 제출됨.
    // STT 가 침묵으로 잠시 꺼지는 건 무시 (auto-restart 로 다시 켜지므로)
    if (
      !answering &&
      autoSubmitRef.current &&
      step === "answer" &&
      editedAnswerRef.current.trim()
    ) {
      autoSubmitRef.current = false;
      const id = setTimeout(() => submitAnswer(), 400);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answering, step]);

  const restart = () => {
    setStep("answer");
    setTurnIdx(0);
    setTurns([]);
    setEditedAnswer("");
    setFeedback(null);
    setPlayCount(0);
    setShowKorean(false);
    setTranslation("");
    setMetrics(undefined);
    resetSTT();
    stopTTS();
  };

  return (
    <WordHoverProvider>
    <div className="space-y-4">
      {visualContent && <Card>{visualContent}</Card>}

      <Card>
        <div className="mb-3">
          <div className="mb-3 p-3 bg-brand-blue/10 border-l-4 border-brand-blue rounded-r-xl flex items-start gap-2">
            <span className="text-xl leading-none">📌</span>
            <div>
              <div className="text-xs font-bold text-brand-blue mb-0.5">미션</div>
              <div className="text-sm font-semibold text-brand-ink leading-snug">
                {MISSION[type]}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="text-xs font-semibold text-brand-red">
              {turnIdx === 0 ? "QUESTION" : "FOLLOW-UP"} (단어 위에 마우스 → 뜻)
            </div>
            {totalTurns > 1 && (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalTurns }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i < turnIdx
                        ? "w-5 bg-brand-navy"
                        : i === turnIdx
                        ? "w-8 bg-brand-blue"
                        : "w-5 bg-brand-gray-200"
                    }`}
                  />
                ))}
                <span className="text-[11px] font-bold text-brand-gray-500 ml-1">
                  {turnIdx + 1} / {totalTurns}
                </span>
              </div>
            )}
          </div>
          <HoverText text={currentQuestion} />

          {showKorean && (
            <div className="mt-3 p-3 bg-blue-50 border-l-4 border-brand-blue rounded-r-lg">
              <div className="text-xs font-bold text-brand-blue mb-1">한글 번역</div>
              <p className="text-sm text-brand-gray-800 leading-relaxed">{translation}</p>
            </div>
          )}

          {step === "intro" && totalTurns > 1 && (
            <div className="mt-3 pt-3 border-t border-brand-gray-100">
              <p className="text-xs text-brand-gray-600 leading-relaxed">
                실제 OPIc 처럼 <b>{totalTurns}개 질문이 이어서</b> 나옵니다. 하나씩 답하면
                마지막에 전체를 묶어 한 번에 채점해요.
              </p>
            </div>
          )}

          {turns.length > 0 && (
            <div className="mt-3 pt-3 border-t border-brand-gray-100 space-y-2">
              <div className="text-xs font-semibold text-brand-gray-500">
                앞서 답한 내용
              </div>
              {turns.map((t, i) => (
                <details key={i} className="group">
                  <summary className="cursor-pointer text-xs text-brand-gray-600 hover:text-brand-navy list-none">
                    <span className="font-bold text-brand-navy">{i + 1}.</span> {t.question}
                  </summary>
                  <p className="mt-1.5 text-sm text-brand-gray-700 leading-relaxed bg-brand-gray-50 p-3 rounded-xl whitespace-pre-wrap">
                    {t.answer || "(답변 없음)"}
                  </p>
                </details>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button
            onClick={speaking ? stopTTS : playQuestion}
            variant={speaking ? "danger" : "primary"}
            size="sm"
          >
            {speaking ? "■ 정지" : "▶ 문제 듣기"}
          </Button>

          <Button onClick={toggleKorean} variant="outline" size="sm" disabled={translating}>
            {translating ? "번역 중..." : showKorean ? "🇰🇷 한글 숨기기" : "🇰🇷 문제 한글로 보기"}
          </Button>

          {step === "intro" && (
            <Button onClick={() => setStep("answer")} variant="primary" size="sm">
              답변 시작 →
            </Button>
          )}
        </div>
      </Card>

      {step !== "intro" && (
        <Card>
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div className="text-xs font-semibold text-brand-red">YOUR ANSWER (실시간 인식)</div>
            <div className="flex gap-2">
              <Button
                onClick={answering ? stopAnsweringOnly : startAnswering}
                variant={answering ? "danger" : "primary"}
                size="sm"
              >
                {answering ? "■ 음성 중지" : "🎤 음성 답변 시작"}
              </Button>
              {answering && editedAnswer.trim() && (
                <Button onClick={submitAnswer} variant="primary" size="sm">
                  {isLastTurn ? "✓ 채점받기" : "✓ 답변 완료"}
                </Button>
              )}
            </div>
          </div>

          {sttError && (
            <div className="mb-3 p-3 bg-brand-red/5 border-l-4 border-brand-red rounded-r-xl">
              <div className="text-xs font-bold text-brand-red mb-1">
                🎤 음성 인식을 사용할 수 없습니다
              </div>
              <div className="text-xs text-brand-ink leading-relaxed">{sttError}</div>
            </div>
          )}

          {answering && (
            <div className="mb-3 rounded-xl border-2 border-brand-red bg-brand-red/5 p-4 min-h-[64px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 bg-brand-red rounded-full ${listening ? "animate-pulse" : "opacity-50"}`} />
                  <span className="text-xs font-bold text-brand-red">
                    {listening ? "실시간 인식 중..." : "음성 대기 중 — 계속 말하세요"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-brand-gray-500">남은 시간</span>
                  <span
                    className={`text-base font-black tabular-nums ${
                      timeLeft <= 10 ? "text-brand-red animate-pulse" : "text-brand-ink"
                    }`}
                  >
                    {timeLeft}s
                  </span>
                </div>
              </div>
              <div className="w-full bg-brand-red/10 rounded-full h-1 mb-3 overflow-hidden">
                <div
                  className="bg-brand-red h-1 transition-all ease-linear"
                  style={{ width: `${(timeLeft / 60) * 100}%` }}
                />
              </div>
              <p className="text-lg leading-relaxed">
                <span className="text-brand-ink font-semibold">{transcript}</span>
                <span className="text-brand-gray-400">{interimTranscript}</span>
                {!transcript && !interimTranscript && (
                  <span className="text-brand-gray-400 text-base">
                    영어로 말해주세요. 60초 안에 {isLastTurn ? "✓ 채점받기" : "✓ 답변 완료"} 를 눌러주세요.
                  </span>
                )}
              </p>
            </div>
          )}

          <textarea
            value={editedAnswer}
            onChange={(e) => setEditedAnswer(e.target.value)}
            placeholder="🎤 버튼을 누르고 영어로 답변하거나, 직접 입력하세요. 인식이 잘못된 단어는 여기서 직접 수정할 수 있어요."
            className="w-full min-h-[140px] border-2 border-brand-gray-300 rounded-xl p-4 text-base leading-relaxed focus:outline-none focus:border-brand-navy resize-y transition-colors"
          />
          <p className="text-[11px] text-brand-gray-500 mt-1">
            💡 인식이 잘 안되는 단어는 위 텍스트 영역에서 직접 수정할 수 있어요.
          </p>
          {editedAnswer && (
            <div className="text-xs text-brand-gray-500 mt-1">
              {editedAnswer.trim().split(/\s+/).filter(Boolean).length} 단어 ·{" "}
              {editedAnswer.split(/[.!?]+/).filter((s) => s.trim()).length} 문장
            </div>
          )}

          {step === "answer" && (
            <>
              <div className="flex gap-2 mt-3">
                <Button onClick={submitAnswer} disabled={!editedAnswer.trim()}>
                  {isLastTurn
                    ? "AI 채점 받기 →"
                    : `다음 질문 → (${turnIdx + 1}/${totalTurns})`}
                </Button>
                <Button
                  onClick={() => {
                    resetSTT();
                    setEditedAnswer("");
                  }}
                  variant="ghost"
                  size="sm"
                >
                  전체 지우기
                </Button>
              </div>
              {!editedAnswer.trim() && (
                <p className="text-xs text-brand-gray-500 mt-2">
                  답변이 비어 있어 버튼이 비활성 상태예요. 🎤 음성 답변을 누르거나 위
                  칸에 직접 입력해주세요.
                </p>
              )}
              {editedAnswer.trim() && !isLastTurn && (
                <p className="text-xs text-brand-gray-500 mt-2">
                  팔로업 질문이 {totalTurns - turnIdx - 1}개 남았어요. 마지막 답변까지
                  마치면 전체를 묶어 채점합니다.
                </p>
              )}
            </>
          )}
        </Card>
      )}

      {step === "feedback" && (
        <FeedbackPanel
          loading={loadingFeedback}
          feedback={feedback}
          userAnswer={[...turns.map((t) => t.answer), editedAnswer]
            .filter(Boolean)
            .join(" ")}
          sampleAnswer={sampleAnswer}
          onRestart={restart}
          metrics={metrics}
        />
      )}
    </div>
    </WordHoverProvider>
  );
}
