"use client";

import type {
  UserSettings,
  StudyRecord,
  VocabEntry,
  MockExamResult,
  UserSession,
} from "@/types";
import { tickFlame } from "./flame";

const SESSION_KEY = "spa.session";

// 세션은 localStorage에 보관 — 명시적 로그아웃 전까지 유지
// (브라우저 종료/탭 종료 후에도 다시 들어오면 로그인 상태 유지)
function getCurrentEmployeeId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s.employeeId || null;
  } catch {
    return null;
  }
}

function scopedKey(base: string): string {
  const uid = getCurrentEmployeeId();
  return uid ? `${base}.${uid}` : base;
}

function safeGetLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSetLocal(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getSession(): UserSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as UserSession) : null;
    } catch {
      return null;
    }
  },

  saveSession(session: UserSession) {
    if (typeof window === "undefined") return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SESSION_KEY);
    // 구버전(sessionStorage 사용)에서 마이그레이션 — 안전하게 둘 다 정리
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  },

  isLoggedIn(): boolean {
    return this.getSession() !== null;
  },

  getSettings(): UserSettings {
    return safeGetLocal<UserSettings>(scopedKey("spa.settings"), {
      examDate: "",
      targetLevel: 6,
      hchatApiKey: "",
      hchatEndpoint: "",
      hchatModel: "claude-sonnet-4-6",
      setupCompleted: false,
    });
  },

  saveSettings(settings: UserSettings) {
    safeSetLocal(scopedKey("spa.settings"), settings);
  },

  isSetupComplete(): boolean {
    return this.getSettings().setupCompleted;
  },

  getRecords(): StudyRecord[] {
    return safeGetLocal<StudyRecord[]>(scopedKey("spa.records"), []);
  },

  addRecord(record: StudyRecord) {
    const records = this.getRecords();
    records.push(record);
    safeSetLocal(scopedKey("spa.records"), records);
    const s = this.getSettings();
    const flame = tickFlame(s.flame);
    this.saveSettings({ ...s, flame });
  },

  updateRecord(id: string, updates: Partial<StudyRecord>) {
    const records = this.getRecords();
    const idx = records.findIndex((r) => r.id === id);
    if (idx !== -1) {
      records[idx] = { ...records[idx], ...updates };
      safeSetLocal(scopedKey("spa.records"), records);
    }
  },

  getVocab(): VocabEntry[] {
    return safeGetLocal<VocabEntry[]>(scopedKey("spa.vocab"), []);
  },

  addVocab(entry: VocabEntry) {
    const vocab = this.getVocab();
    if (!vocab.some((v) => v.word.toLowerCase() === entry.word.toLowerCase())) {
      vocab.push(entry);
      safeSetLocal(scopedKey("spa.vocab"), vocab);
    }
  },

  removeVocab(word: string) {
    const vocab = this.getVocab().filter(
      (v) => v.word.toLowerCase() !== word.toLowerCase(),
    );
    safeSetLocal(scopedKey("spa.vocab"), vocab);
  },

  getMockResults(): MockExamResult[] {
    return safeGetLocal<MockExamResult[]>(scopedKey("spa.mockResults"), []);
  },

  addMockResult(result: MockExamResult) {
    const results = this.getMockResults();
    results.push(result);
    safeSetLocal(scopedKey("spa.mockResults"), results);
  },

  clearMyData() {
    const uid = getCurrentEmployeeId();
    if (!uid) return;
    const settings = this.getSettings();
    ["spa.records", "spa.vocab", "spa.mockResults"].forEach(
      (k) => localStorage.removeItem(`${k}.${uid}`),
    );
    this.saveSettings(settings);
  },
};
