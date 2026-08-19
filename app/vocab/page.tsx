"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { useTTS } from "@/lib/speech";
import type { VocabEntry } from "@/types";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function VocabPage() {
  const router = useRouter();
  const [vocab, setVocab] = useState<VocabEntry[]>([]);
  const [search, setSearch] = useState("");
  const { speak } = useTTS();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!storage.isSetupComplete()) {
      router.push("/setup");
      return;
    }
    setVocab(storage.getVocab());
    setMounted(true);
  }, [router]);

  if (!mounted) return null;

  const filtered = vocab
    .filter((v) =>
      search ? v.word.toLowerCase().includes(search.toLowerCase()) : true,
    )
    .sort((a, b) => b.addedAt - a.addedAt);

  const remove = (word: string) => {
    storage.removeVocab(word);
    setVocab(storage.getVocab());
  };

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/dashboard" className="text-xs text-brand-gray-600 hover:text-brand-navy">
            ← 대시보드
          </Link>
          <h1 className="text-3xl font-bold text-brand-gray-900 mt-1">단어장</h1>
          <p className="text-brand-gray-600">
            AI 피드백에서 모은 표현 {vocab.length}개. 클릭하면 들을 수 있어요.
          </p>
        </div>

        <Card className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="단어 검색..."
            className="w-full border border-brand-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-navy"
          />
        </Card>

        {filtered.length === 0 ? (
          <Card className="text-center py-12 text-brand-gray-600">
            아직 단어장이 비어있어요. AI 피드백에서 "+ 단어장" 버튼을 눌러 추가하세요.
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((v, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-brand-navy">{v.word}</h3>
                      <button
                        onClick={() => speak(v.word)}
                        className="text-xs text-brand-gray-500 hover:text-brand-navy"
                      >
                        🔊
                      </button>
                    </div>
                    <p className="text-sm text-brand-gray-700">{v.meaning}</p>
                    {v.example && (
                      <p className="text-xs text-brand-gray-500 mt-1 italic">"{v.example}"</p>
                    )}
                  </div>
                  <Button onClick={() => remove(v.word)} variant="ghost" size="sm">
                    🗑
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
