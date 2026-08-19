import ChartRenderer from "@/components/charts/ChartRenderer";
import type3Data from "@/data/type3_visual.json";
import Link from "next/link";

export default function ChartDemoPage() {
  const chartItems = type3Data.items
    .filter((item: any) => item.subtype !== "photo")
    .slice(0, 12);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-brand-gray-600 hover:text-brand-navy mb-2 inline-block"
          >
            ← 홈으로
          </Link>
          <h1 className="text-3xl font-bold text-brand-gray-900 mb-2">
            유형3 차트 렌더링 데모
          </h1>
          <p className="text-brand-gray-600">
            JSON 데이터에서 동적으로 생성된 차트 12개. 실제 시험처럼 분석/묘사 연습용.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartItems.map((item: any) => (
            <ChartRenderer key={item.id} item={item} />
          ))}
        </div>

        <div className="mt-12 p-6 bg-brand-navy/5 rounded-2xl border border-brand-navy/10">
          <h2 className="font-bold text-brand-navy mb-2">차트 타입 8종 지원</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-brand-gray-700">
            <div>• 파이 차트 (Pie)</div>
            <div>• 도넛 차트 (Donut)</div>
            <div>• 막대 그래프 (Bar)</div>
            <div>• 가로 막대 (Horizontal Bar)</div>
            <div>• 꺾은선 그래프 (Line)</div>
            <div>• 영역 차트 (Area)</div>
            <div>• 비교 막대 (Comparison)</div>
            <div>• 스택 막대 (Stacked) + 산점도</div>
          </div>
        </div>
      </div>
    </main>
  );
}
