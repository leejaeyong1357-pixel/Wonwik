"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { levelLabel, scoreToLevel } from "@/lib/scoring";
import type { StudyRecord, MockExamResult } from "@/types";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts";
import { CHART_PALETTE, BRAND_COLORS } from "@/lib/colors";

export default function StatsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [mockResults, setMockResults] = useState<MockExamResult[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!storage.isSetupComplete()) {
      router.push("/setup");
      return;
    }
    setRecords(storage.getRecords());
    setMockResults(storage.getMockResults());
    setMounted(true);
  }, [router]);

  if (!mounted) return null;

  const totalCount = records.length;
  const avgScore =
    totalCount > 0
      ? Math.round(records.reduce((s, r) => s + (r.score || 0), 0) / totalCount)
      : 0;
  const estLevel = avgScore > 0 ? scoreToLevel(avgScore) : 1;

  const byType = [1, 2, 3, 4].map((t) => {
    const rs = records.filter((r) => r.type === t);
    return {
      type: `유형 ${t}`,
      avg: rs.length > 0 ? Math.round(rs.reduce((s, r) => s + (r.score || 0), 0) / rs.length) : 0,
      count: rs.length,
    };
  });

  const recentTrend = records
    .slice(-20)
    .map((r, i) => ({
      label: `${i + 1}`,
      score: r.score || 0,
    }));

  const mockTrend = mockResults.map((m, i) => ({
    label: `M${i + 1}`,
    score: m.totalScore,
  }));

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/dashboard" className="text-xs text-brand-gray-600 hover:text-brand-navy">
            ← 대시보드
          </Link>
          <h1 className="text-3xl font-bold text-brand-gray-900 mt-1">학습 통계</h1>
          <p className="text-brand-gray-600">진도와 강약점을 데이터로 확인하세요.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-xs text-brand-gray-600">총 문제</div>
            <div className="text-3xl font-black text-brand-navy">{totalCount}</div>
          </Card>
          <Card>
            <div className="text-xs text-brand-gray-600">평균 점수</div>
            <div className="text-3xl font-black text-brand-navy">{avgScore || "—"}</div>
            <div className="text-xs text-brand-gray-500">/ 96</div>
          </Card>
          <Card>
            <div className="text-xs text-brand-gray-600">예상 등급</div>
            <div className="text-3xl font-black text-brand-navy">
              {totalCount > 0 ? estLevel : "—"}
            </div>
          </Card>
          <Card>
            <div className="text-xs text-brand-gray-600">모의고사</div>
            <div className="text-3xl font-black text-brand-navy">{mockResults.length}회</div>
          </Card>
        </div>

        {recentTrend.length > 0 && (
          <Card className="mb-6">
            <h2 className="font-bold text-brand-gray-900 mb-3">최근 학습 점수 추이</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={recentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 96]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={BRAND_COLORS.navy}
                  strokeWidth={2}
                  dot={{ r: 4, fill: BRAND_COLORS.red }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card className="mb-6">
          <h2 className="font-bold text-brand-gray-900 mb-3">유형별 평균 점수</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis domain={[0, 96]} />
              <Tooltip />
              <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                {byType.map((_, i) => (
                  <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-4 gap-2 mt-3 text-xs text-brand-gray-600">
            {byType.map((t) => (
              <div key={t.type} className="text-center">
                <div className="font-semibold">{t.type}</div>
                <div>{t.count}문제</div>
              </div>
            ))}
          </div>
        </Card>

        {mockTrend.length > 0 && (
          <Card>
            <h2 className="font-bold text-brand-gray-900 mb-3">모의고사 점수 추이</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 96]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={BRAND_COLORS.red}
                  strokeWidth={3}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </main>
    </>
  );
}
