"use client";

import { createContext, useContext, useState, useCallback } from "react";
import dictionary from "@/data/dictionary.json";
import { translateWord } from "@/lib/ai";
import { storage } from "@/lib/storage";

const dict: Record<string, string> = dictionary as any;

function lookupLocal(raw: string): string | null {
  const w = raw.toLowerCase().replace(/[^a-z']/g, "");
  if (!w) return null;
  if (dict[w]) return dict[w];
  if (w.endsWith("s") && dict[w.slice(0, -1)]) return dict[w.slice(0, -1)];
  if (w.endsWith("es") && dict[w.slice(0, -2)]) return dict[w.slice(0, -2)];
  if (w.endsWith("ed") && dict[w.slice(0, -2)]) return dict[w.slice(0, -2)];
  if (w.endsWith("ing") && dict[w.slice(0, -3)]) return dict[w.slice(0, -3)];
  if (w.endsWith("ly") && dict[w.slice(0, -2)]) return dict[w.slice(0, -2)];
  return null;
}

interface HoverState {
  word: string;
  meaning: string;
  loading: boolean;
}

interface Ctx {
  setWord: (w: string) => void;
}

const HoverCtx = createContext<Ctx | null>(null);

export function WordHoverProvider({ children }: { children: React.ReactNode }) {
  const [hover, setHover] = useState<HoverState | null>(null);

  const setWord = useCallback(async (word: string) => {
    if (!word) return;
    const local = lookupLocal(word);
    if (local) {
      setHover({ word, meaning: local, loading: false });
      return;
    }
    setHover({ word, meaning: "...", loading: true });
    const settings = storage.getSettings();
    const meaning = await translateWord(word, {
      model: settings.aiModel,
    });
    setHover({ word, meaning, loading: false });
  }, []);

  return (
    <HoverCtx.Provider value={{ setWord }}>
      {children}
      <div className="fixed top-24 right-6 z-50 w-64 hidden xl:block">
        {hover ? (
          <div className="bg-white border-2 border-brand-blue rounded-2xl p-4 shadow-xl">
            <div className="text-xs font-bold text-brand-blue mb-1">📖 사전</div>
            <div className="text-xl font-black text-brand-navy mb-2 break-all">
              {hover.word}
            </div>
            <div className="text-base text-brand-gray-800 font-semibold min-h-[24px]">
              {hover.loading ? (
                <span className="inline-block w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
              ) : (
                hover.meaning
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-brand-gray-200 text-xs text-brand-gray-500">
              다른 단어 위에 마우스를 올려보세요
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-brand-blue/10 to-white border-2 border-dashed border-brand-blue/40 rounded-2xl p-4">
            <div className="text-2xl mb-2">💡</div>
            <div className="text-sm font-bold text-brand-ink mb-1">
              모르는 단어가 있나요?
            </div>
            <div className="text-xs text-brand-gray-600 leading-relaxed">
              영어 단어 위에 <b className="text-brand-blue">마우스를 올리면</b>
              {" "}한글 뜻이 여기에 표시됩니다.
            </div>
          </div>
        )}
      </div>
    </HoverCtx.Provider>
  );
}

export function HoverText({ text }: { text: string }) {
  const ctx = useContext(HoverCtx);
  const tokens = text.split(/(\s+|[.,!?;:"'()])/).filter((t) => t.length > 0);

  return (
    <div className="text-lg font-semibold text-brand-gray-900 leading-relaxed">
      {tokens.map((token, i) => {
        const isWord = /^[A-Za-z'-]+$/.test(token);
        if (!isWord) return <span key={i}>{token}</span>;
        return (
          <span
            key={i}
            onMouseEnter={() => ctx?.setWord(token)}
            className="cursor-help rounded px-0.5 border-b-2 border-brand-blue/25 hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-colors"
          >
            {token}
          </span>
        );
      })}
    </div>
  );
}
