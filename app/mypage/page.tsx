"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { storage } from "@/lib/storage";
import { hashPassword, getStoredPwHash, setStoredPwHash } from "@/lib/passwordStore";
import { pushUserToServer } from "@/lib/userSync";
import { getDaysUntil, levelLabel, levelUsage } from "@/lib/scoring";
import { testConnection } from "@/lib/ai";
import { AVAILABLE_MODELS, DEFAULT_MODEL, DEFAULT_TARGET_GRADE, SELECTABLE_GRADES } from "@/lib/constants";
import type { Level, UserSession, UserSettings } from "@/types";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";

export default function MyPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [examDate, setExamDate] = useState("");
  const [targetLevel, setTargetLevel] = useState<Level>(DEFAULT_TARGET_GRADE);
  const [aiModel, setAiModel] = useState<string>(DEFAULT_MODEL);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [saveMsg, setSaveMsg] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const runApiTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection({ model: aiModel });
    setTestResult(result);
    setTesting(false);
  };

  useEffect(() => {
    const s = storage.getSession();
    if (!s) {
      router.push("/login");
      return;
    }
    if (s.isAdmin) {
      router.push("/admin");
      return;
    }
    setSession(s);
    const cfg = storage.getSettings();
    setSettings(cfg);
    setExamDate(cfg.examDate);
    setTargetLevel(cfg.targetLevel);
    if (cfg.aiModel) setAiModel(cfg.aiModel);
  }, [router]);

  if (!session || !settings) return null;

  const saveSettings = () => {
    storage.saveSettings({
      ...settings,
      examDate,
      targetLevel,
      aiModel,
    });
    pushUserToServer();
    setSaveMsg("✓ 저장되었습니다");
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    const storedHash = getStoredPwHash(session.employeeId);

    if (storedHash) {
      const currentHash = await hashPassword(currentPw);
      if (currentHash !== storedHash) {
        setPwMsg({ ok: false, text: "현재 비밀번호가 일치하지 않습니다." });
        return;
      }
    }
    if (newPw.length < 6) {
      setPwMsg({ ok: false, text: "새 비밀번호는 6자 이상이어야 합니다." });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "새 비밀번호 확인이 일치하지 않습니다." });
      return;
    }
    if (newPw === currentPw) {
      setPwMsg({ ok: false, text: "기존과 동일한 비밀번호입니다." });
      return;
    }

    const newHash = await hashPassword(newPw);
    setStoredPwHash(session.employeeId, newHash);
    pushUserToServer();
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setPwMsg({ ok: true, text: "비밀번호가 변경되었습니다." });
  };

  const dDay = getDaysUntil(examDate);

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/dashboard" className="text-xs text-brand-gray-600 hover:text-brand-navy">
            ← 대시보드
          </Link>
          <h1 className="hero-headline text-3xl text-brand-ink mt-1">마이페이지</h1>
          <p className="text-sm text-brand-gray-600">내 정보와 학습 설정을 관리하세요</p>
        </div>

        <section className="bg-white rounded-3xl border border-brand-gray-200 p-6 mb-4">
          <h2 className="font-bold text-lg text-brand-ink mb-4">내 정보</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="이름" value={session.name} />
            <Info label="사번" value={session.employeeId} mono />
            <Info label="팀" value={session.team || "—"} />
            <Info label="직급" value={session.position || "—"} />
            <Info label="로그인 시각" value={new Date(session.loggedInAt).toLocaleString("ko-KR")} />
            <Info label="시험까지" value={dDay >= 0 ? `D-${dDay}` : "—"} />
          </div>
        </section>

        <section className="bg-gradient-to-br from-brand-blue/5 to-white border border-brand-blue/30 rounded-3xl p-6 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-lg text-brand-ink mb-1">📘 이용 가이드</h2>
              <p className="text-sm text-brand-gray-600 mb-3">
                학습 방법과 화면 사용법을 PDF로 안내드려요.
              </p>
            </div>
            <div className="text-3xl">📄</div>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/assets?key=user-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-brand-blue text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              📖 PDF 보기
            </a>
            <a
              href="/api/assets?key=user-guide&dl=1"
              className="px-4 py-2 bg-white border-2 border-brand-blue text-brand-blue text-sm font-bold rounded-xl hover:bg-brand-blue/5 transition-colors"
            >
              ⬇ 다운로드
            </a>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-brand-gray-200 p-6 mb-4">
          <h2 className="font-bold text-lg text-brand-ink mb-4">학습 설정</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-gray-700 mb-1.5">시험 일자</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full border-2 border-brand-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-gray-700 mb-1.5">
                목표 등급: <span className="text-brand-navy">{levelLabel(targetLevel)}</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {SELECTABLE_GRADES.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setTargetLevel(grade)}
                    className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                      targetLevel === grade
                        ? "bg-brand-navy text-white"
                        : "bg-brand-gray-100 text-brand-gray-700 hover:bg-brand-gray-200"
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
              <p className="text-xs text-brand-gray-500 mt-1.5">{levelUsage(targetLevel)}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-gray-700 mb-1.5">
                모델
              </label>
              <select
                value={aiModel}
                onChange={(e) => {
                  setAiModel(e.target.value);
                  setTestResult(null);
                }}
                className="w-full border-2 border-brand-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-navy"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-brand-gray-500 mt-1">
                정확도가 높을수록 응답이 느립니다
              </p>
            </div>

            <Button
              onClick={runApiTest}
              variant="outline"
              size="sm"
              disabled={testing}
              fullWidth
            >
              {testing ? "테스트 중..." : "🔌 API 연결 테스트"}
            </Button>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-sm ${
                  testResult.ok
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <div className="font-bold mb-1">
                  {testResult.ok ? "✓ 연결 성공" : "✗ 연결 실패"}
                </div>
                <div className="text-xs">{testResult.message}</div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {saveMsg && <span className="text-sm text-green-600 font-semibold">{saveMsg}</span>}
              <div className="ml-auto">
                <Button onClick={saveSettings}>저장</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-brand-gray-200 p-6 mb-4">
          <h2 className="font-bold text-lg text-brand-ink mb-1">비밀번호 설정 / 변경</h2>
          <p className="text-xs text-brand-gray-500 mb-4">
            본인 확인용 비밀번호를 설정·변경할 수 있습니다. (선택)
          </p>
          <form onSubmit={changePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-brand-gray-700 mb-1.5">
                현재 비밀번호 <span className="text-brand-gray-400 font-normal">(처음 설정 시 비워두세요)</span>
              </label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full border-2 border-brand-gray-200 rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:border-brand-navy"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-gray-700 mb-1.5">새 비밀번호 (6자 이상)</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full border-2 border-brand-gray-200 rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:border-brand-navy"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-gray-700 mb-1.5">새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full border-2 border-brand-gray-200 rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:border-brand-navy"
              />
            </div>
            {pwMsg && (
              <div
                className={`text-sm p-3 rounded-xl ${
                  pwMsg.ok
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {pwMsg.text}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="danger">비밀번호 변경</Button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-3xl border border-brand-gray-200 p-6 mb-4">
          <h2 className="font-bold text-lg text-brand-ink mb-3">기타</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                storage.saveSettings({ ...settings, onboardingSeen: false, onboardingSkipForever: false });
                router.push("/onboarding");
              }}
              className="block w-full text-left p-3 hover:bg-brand-gray-50 rounded-xl text-sm text-brand-gray-700"
            >
              📘 OPIc 시험 안내 다시 보기
            </button>
            <button
              onClick={async () => {
                if (!confirm("학습 기록·단어장·불꽃을 모두 삭제합니다. 진행하시겠습니까?")) return;
                storage.clearMyData();
                localStorage.removeItem("spa.wordCache");
                // 서버(KV) 학습 기록·불꽃도 같이 비움
                try {
                  await fetch(
                    `/api/user-settings?employeeId=${encodeURIComponent(session.employeeId)}`,
                    { method: "DELETE" },
                  );
                } catch {}
                // settings 의 flame 도 초기화해서 push
                const s = storage.getSettings();
                storage.saveSettings({
                  ...s,
                  flame: { level: 0, streak: 0, lastStudyDay: "", color: s.flame?.color || "#FF6B35" },
                });
                alert("초기화되었습니다.");
                router.push("/dashboard");
              }}
              className="block w-full text-left p-3 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-semibold text-brand-red border border-red-200"
            >
              🗑 학습 기록 전체 초기화
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-brand-gray-500">{label}</div>
      <div className={`font-semibold text-brand-ink ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
