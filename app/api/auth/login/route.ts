import { NextResponse } from "next/server";
import data from "@/data/employees.json";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const employeeId = String(body.employeeId || "").trim();
    // 시연 계정은 사번만으로 조회한다 (이름 대조 생략)
    const demo = body.demo === true;

    if (!employeeId || (!demo && !name)) {
      return NextResponse.json({ ok: false, error: "사번과 이름을 입력해주세요" });
    }

    const emp = (data.employees as any[]).find((e) =>
      demo
        ? String(e.employeeId).trim() === employeeId
        : e.name === name && String(e.employeeId).trim() === employeeId,
    );

    if (!emp) {
      return NextResponse.json({
        ok: false,
        error: "등록되지 않은 사번/이름입니다",
      });
    }

    // 본인 정보만 반환 (다른 직원 정보는 절대 클라이언트로 나가지 않음)
    return NextResponse.json({
      ok: true,
      user: {
        name: emp.name,
        employeeId: String(emp.employeeId),
        team: emp.team,
        position: emp.position,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청" });
  }
}
