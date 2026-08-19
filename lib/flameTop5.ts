import learnersData from "@/data/learners_mock.json";

export interface FlameTop5Entry {
  employeeId: string;
  name: string;
  team: string;
  position: string;
  flameLevel: number;
  flameColor: string;
  flameStreak: number;
}

// learners_mock만 의존 (employees.json 없음).
// dashboard FlameRankingModal 에서 본인 데이터와 합쳐 표시.
export function getFlameTop5(): FlameTop5Entry[] {
  return (learnersData.learners as any[])
    .filter((l) => l.flameLevel > 0)
    .map((l) => ({
      employeeId: String(l.employeeId),
      name: l.name,
      team: l.team,
      position: l.position,
      flameLevel: l.flameLevel,
      flameColor: l.flameColor,
      flameStreak: l.flameStreak,
    }))
    .sort((a, b) => b.flameLevel - a.flameLevel || b.flameStreak - a.flameStreak)
    .slice(0, 5);
}
