import employeesData from "@/data/employees.json";
import learnersData from "@/data/learners_mock.json";

export interface AdminLearnerRow {
  name: string;
  employeeId: string;
  team: string;
  position: string;
  grade: string;
  status: "active" | "inactive" | "not_started";
  targetLevel: number | null;
  examDate: string | null;
  totalStudyMinutes: number;
  totalProblems: number;
  averageScore: number;
  recentScore: number;
  estimatedLevel: number | null;
  mockExamCount: number;
  lastActiveAt: number | null;
  flameLevel: number;
  flameColor: string;
  flameStreak: number;
}

export function getAllLearners(): AdminLearnerRow[] {
  const progressMap = new Map<string, any>();
  (learnersData.learners as any[]).forEach((l) => {
    progressMap.set(String(l.employeeId), l);
  });

  return (employeesData.employees as any[]).map((emp) => {
    const progress = progressMap.get(String(emp.employeeId));
    if (!progress) {
      return {
        name: emp.name,
        employeeId: String(emp.employeeId),
        team: emp.team,
        position: emp.position,
        grade: emp.grade,
        status: "not_started",
        targetLevel: null,
        examDate: null,
        totalStudyMinutes: 0,
        totalProblems: 0,
        averageScore: 0,
        recentScore: 0,
        estimatedLevel: null,
        mockExamCount: 0,
        lastActiveAt: null,
        flameLevel: 0,
        flameColor: "#FF6B35",
        flameStreak: 0,
      } as AdminLearnerRow;
    }
    const isActive = Date.now() - progress.lastActiveAt < 7 * 86400000;
    return {
      name: emp.name,
      employeeId: String(emp.employeeId),
      team: emp.team,
      position: emp.position,
      grade: emp.grade,
      status: isActive ? "active" : "inactive",
      targetLevel: progress.targetLevel,
      examDate: progress.examDate,
      totalStudyMinutes: progress.totalStudyMinutes,
      totalProblems: progress.totalProblems,
      averageScore: progress.averageScore,
      recentScore: progress.recentScore,
      estimatedLevel: progress.estimatedLevel,
      mockExamCount: progress.mockExamCount,
      lastActiveAt: progress.lastActiveAt,
      flameLevel: progress.flameLevel ?? 0,
      flameColor: progress.flameColor ?? "#FF6B35",
      flameStreak: progress.flameStreak ?? 0,
    } as AdminLearnerRow;
  });
}

export function getFlameTop5(): AdminLearnerRow[] {
  return getAllLearners()
    .filter((l) => l.flameLevel > 0)
    .sort((a, b) => b.flameLevel - a.flameLevel || b.flameStreak - a.flameStreak)
    .slice(0, 5);
}

export function getAdminStats() {
  const all = getAllLearners();
  const started = all.filter((l) => l.status !== "not_started");
  const active = all.filter((l) => l.status === "active");
  const reached = started.filter(
    (l) => l.targetLevel && l.estimatedLevel && l.estimatedLevel >= l.targetLevel,
  );
  const avgScore =
    started.length > 0
      ? Math.round(started.reduce((s, l) => s + l.averageScore, 0) / started.length)
      : 0;
  const avgHours =
    started.length > 0
      ? Math.round(started.reduce((s, l) => s + l.totalStudyMinutes, 0) / started.length / 60)
      : 0;

  return {
    total: all.length,
    started: started.length,
    notStarted: all.length - started.length,
    active: active.length,
    avgScore,
    avgHours,
    targetReached: reached.length,
  };
}

export function getTop5() {
  return getAllLearners()
    .filter((l) => l.status !== "not_started")
    .sort((a, b) => b.recentScore - a.recentScore)
    .slice(0, 5);
}

export function getTeamAverages() {
  const map: Record<string, { count: number; sum: number; started: number }> = {};
  getAllLearners().forEach((l) => {
    if (!map[l.team]) map[l.team] = { count: 0, sum: 0, started: 0 };
    map[l.team].count++;
    if (l.status !== "not_started") {
      map[l.team].started++;
      map[l.team].sum += l.averageScore;
    }
  });
  return Object.entries(map)
    .map(([team, { count, sum, started }]) => ({
      team,
      total: count,
      started,
      avg: started > 0 ? Math.round(sum / started) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getLevelDistribution() {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
  getAllLearners().forEach((l) => {
    if (l.targetLevel) dist[l.targetLevel]++;
  });
  return Object.entries(dist).map(([lv, count]) => ({
    level: `Lv${lv}`,
    count,
  }));
}
