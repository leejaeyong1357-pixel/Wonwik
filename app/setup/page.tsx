"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { storage } from "@/lib/storage";
import { pushUserToServer } from "@/lib/userSync";
import { LEVEL_RANGES, levelDescription } from "@/lib/scoring";
import { testConnection } from "@/lib/hchat";
import type { Level } from "@/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function SetupPage() {
  const router = useRouter();
  const [examDate, setExamDate] = useState("");
  const [targetLevel, setTargetLevel] = useState<Level>(6);
  const [hchatApiKey, setHchatApiKey] = useState("");
  const hchatModel = "claude-sonnet-4-6";
  const [step, setStep] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const s = storage.getSettings();
    if (s.examDate) setExamDate(s.examDate);
    if (s.targetLevel) setTargetLevel(s.targetLevel);
    if (s.hchatApiKey) setHchatApiKey(s.hchatApiKey);
    setLoaded(true);
  }, []);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection({
      apiKey: hchatApiKey,
      model: hchatModel,
    });
    setTestResult(result);
    setTesting(false);
  };

  const save = () => {
    const existing = storage.getSettings();
    storage.saveSettings({
      ...existing,
      examDate,
      targetLevel,
      hchatEndpoint: "",
      hchatApiKey: "",
      hchatModel,
      setupCompleted: true,
    });
    // 서버(KV)에도 백업 — 캐시 비워져도 다음 로그인 때 자동 복원
    pushUserToServer();
    router.push("/loading-setup");
  };

  if (!loaded) return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-brand-gray-50">
      <div className="max-w-xl w-full">
        <div className="text-center mb-6">
          <Image
            src="/brand-logo.svg"
            alt="WONIK"
            width={160}
            height={38}
            priority
            className="h-9 w-auto mx-auto mb-2"
          />
          <h1 className="text-2xl font-bold text-brand-gray-900">SPA Trainer 초기 설정</h1>
          <p className="text-sm text-brand-gray-600 mt-1">단계 {step} / 3</p>
        </div>

        <Card>
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold mb-1 text-brand-gray-900">시험 일정</h2>
              <p className="text-sm text-brand-gray-600 mb-4">
                SPA 시험 예정일을 알려주세요. 남은 일수에 맞춰 학습량을 추천합니다.
              </p>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-brand-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-navy"
              />
              <div className="flex justify-end mt-6">
                <Button onClick={() => setStep(2)} disabled={!examDate}>
                  다음 →
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold mb-1 text-brand-gray-900">목표 등급</h2>
              <p className="text-sm text-brand-gray-600 mb-4">
                도달하고 싶은 SPA 등급을 선택하세요. 난이도와 모범답안 수준이 맞춰집니다.
              </p>
              <div className="space-y-2">
                {(Object.entries(LEVEL_RANGES) as [string, [number, number]][]).map(
                  ([lv, [min, max]]) => {
                    const level = Number(lv) as Level;
                    return (
                      <button
                        key={lv}
                        onClick={() => setTargetLevel(level)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                          targetLevel === level
                            ? "border-brand-navy bg-brand-navy/5"
                            : "border-brand-gray-200 hover:border-brand-gray-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-brand-gray-900">
                              Lv {lv} <span className="text-sm text-brand-gray-600">({min}~{max}점)</span>
                            </div>
                            <div className="text-xs text-brand-gray-600 mt-0.5">
                              {levelDescription(level)}
                            </div>
                          </div>
                          {targetLevel === level && <span className="text-brand-red">●</span>}
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
              <div className="flex justify-between mt-6">
                <Button onClick={() => setStep(1)} variant="ghost">
                  ← 이전
                </Button>
                <Button onClick={() => setStep(3)}>다음 →</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold mb-1 text-brand-gray-900">AI 채점 준비 완료</h2>
              <p className="text-sm text-brand-gray-600 mb-4">
                별도의 API 키 발급 없이 바로 사용할 수 있어요.
              </p>

              <div className="bg-brand-blue/5 border border-brand-blue/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2.5">
                  <span className="text-2xl leading-none">🤖</span>
                  <div className="text-sm text-brand-ink leading-relaxed">
                    <b className="text-brand-blue">Claude AI</b> 가 답변을 채점합니다.
                    <br />
                    발음·청취·어휘·문법·유창성 5개 영역을 분석하고
                    <br />
                    목표 등급에 맞춘 모범답안을 제안해드려요.
                  </div>
                </div>
              </div>

              <ul className="text-sm text-brand-gray-700 space-y-1.5 mb-2">
                <li>✓ 시험일 <b>{examDate || "-"}</b></li>
                <li>✓ 목표 등급 <b>Lv {targetLevel}</b></li>
                <li>✓ AI 채점 사용 가능</li>
              </ul>

              <div className="flex justify-between mt-6">
                <Button onClick={() => setStep(2)} variant="ghost">
                  ← 이전
                </Button>
                <Button onClick={save}>설정 완료 →</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
