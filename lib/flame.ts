import type { FlameState } from "@/types";

export const MAX_FLAME_LEVEL = 10;
export const FLAME_COLORS: { name: string; value: string }[] = [
  { name: "주황", value: "#FF6B35" },
  { name: "빨강", value: "#E63946" },
  { name: "파랑", value: "#2E5BFF" },
  { name: "보라", value: "#8B5CF6" },
  { name: "초록", value: "#10B981" },
  { name: "분홍", value: "#EC4899" },
];

function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86400000,
  );
}

export function defaultFlame(): FlameState {
  return { level: 0, streak: 0, lastStudyDay: "", color: FLAME_COLORS[0].value };
}

/** 오늘 학습 완료 시 호출 */
export function tickFlame(flame: FlameState | undefined): FlameState {
  const f = flame ?? defaultFlame();
  const t = today();
  if (f.lastStudyDay === t) return f;

  let level = f.level;
  let streak = f.streak;

  if (!f.lastStudyDay) {
    level = 1;
    streak = 1;
  } else {
    const gap = daysBetween(f.lastStudyDay, t);
    if (gap === 1) {
      streak += 1;
      level = Math.min(MAX_FLAME_LEVEL, level + 1);
    } else if (gap > 1) {
      const missed = gap - 1;
      level = Math.max(0, level - missed);
      level = Math.min(MAX_FLAME_LEVEL, level + 1);
      streak = 1;
    }
  }
  return { ...f, level, streak, lastStudyDay: t };
}

/** 대시보드 렌더 시 - 며칠 안 했으면 단계 차감해서 반환 */
export function decayedFlame(flame: FlameState | undefined): FlameState {
  const f = flame ?? defaultFlame();
  if (!f.lastStudyDay) return f;
  const t = today();
  const gap = daysBetween(f.lastStudyDay, t);
  if (gap <= 1) return f;
  const missed = gap - 1;
  const level = Math.max(0, f.level - missed);
  return { ...f, level, streak: level > 0 ? f.streak : 0 };
}
