import { getOptionalRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface FlameEntry {
  employeeId: string;
  name: string;
  team: string;
  position: string;
  flameLevel: number;
  flameColor: string;
  flameStreak: number;
  lastStudyDay: string;
  updatedAt: number;
}

// Cloudflare Pages → Settings → Functions → KV namespace bindings 에서
// 변수명 SPA_KV 로 KV 네임스페이스를 연결하면 사용자끼리 불꽃이 공유됩니다.
// 바인딩이 없으면(로컬/미설정) 조용히 빈 결과를 돌려줘서 사이트는 정상 동작.
function getKV(): any {
  const ctx = getOptionalRequestContext();
  return (ctx?.env as any)?.SPA_KV ?? null;
}

export async function GET() {
  const kv = getKV();
  if (!kv) return NextResponse.json({ ok: true, kv: false, entries: [] });

  const list = await kv.list({ prefix: "flame:", limit: 1000 });
  const entries: FlameEntry[] = (list.keys || [])
    .map((k: any) => k.metadata as FlameEntry | undefined)
    .filter((e: FlameEntry | undefined): e is FlameEntry => !!e && e.flameLevel > 0)
    .sort(
      (a: FlameEntry, b: FlameEntry) =>
        b.flameLevel - a.flameLevel || b.flameStreak - a.flameStreak,
    );

  return NextResponse.json({ ok: true, kv: true, entries });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }

  const id = String(body?.employeeId || "").trim();
  if (!id) return NextResponse.json({ ok: false, error: "사번 없음" }, { status: 400 });

  const entry: FlameEntry = {
    employeeId: id,
    name: String(body.name || ""),
    team: String(body.team || ""),
    position: String(body.position || ""),
    flameLevel: Number(body.flameLevel) || 0,
    flameColor: String(body.flameColor || "#FF6B35"),
    flameStreak: Number(body.flameStreak) || 0,
    lastStudyDay: String(body.lastStudyDay || ""),
    updatedAt: Date.now(),
  };

  const kv = getKV();
  if (!kv) return NextResponse.json({ ok: true, kv: false });

  // 값과 함께 metadata 로도 저장 → 랭킹 조회 시 list() 한 번으로 끝(읽기 비용 절감)
  await kv.put(`flame:${id}`, JSON.stringify(entry), { metadata: entry });
  return NextResponse.json({ ok: true, kv: true });
}
