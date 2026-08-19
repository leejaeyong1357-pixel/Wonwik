/*
 * 엑셀 임직원 명단을 employees.json 으로 변환
 *
 * 사용법:
 *   1. data/ 폴더에 엑셀 파일을 넣는다 (예: data/spa학습자_로우데이터.xlsx)
 *   2. 터미널에서: node scripts/importExcel.js [파일경로]
 *   3. data/employees.json 이 자동 갱신됨
 *
 * 엑셀 컬럼 순서 (헤더 기준):
 *   A: No
 *   B: 부서
 *   C: 직위
 *   D: 사원번호
 *   E: 성명
 *   F: 직급
 *   G: 주민등록번호 앞자리
 */

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const inputPath = process.argv[2] || path.join(__dirname, "..", "data", "spa학습자_로우데이터.xlsx");
const outputPath = path.join(__dirname, "..", "data", "employees.json");

if (!fs.existsSync(inputPath)) {
  console.error(`❌ 파일을 찾을 수 없습니다: ${inputPath}`);
  console.error("사용법: node scripts/importExcel.js [엑셀파일경로]");
  process.exit(1);
}

console.log(`📂 읽는 중: ${inputPath}`);
const workbook = XLSX.readFile(inputPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

// 헤더 자동 감지 (첫번째 행이 No 또는 빈 셀이면 헤더로 간주)
const dataStartRow = (() => {
  for (let i = 0; i < rows.length; i++) {
    if (typeof rows[i][0] === "number") return i;
    if (String(rows[i][0] || "").trim() === "1") return i;
  }
  return 1; // fallback
})();

const employees = [];
for (let i = dataStartRow; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.length === 0) continue;
  const [no, team, position, employeeId, name, grade] = row;
  if (!name || !employeeId) continue;

  // 주민번호(G열)는 개인정보 보호를 위해 의도적으로 가져오지 않습니다.
  employees.push({
    no: Number(no),
    team: String(team || "").trim(),
    position: String(position || "").trim(),
    employeeId: String(employeeId).trim(),
    name: String(name).trim(),
    grade: String(grade || "").trim(),
  });
}

const output = {
  _comment: "Auto-generated from " + path.basename(inputPath) + " — 주민번호 미수집",
  _columns: ["No", "부서", "직위", "사원번호", "성명", "직급"],
  employees,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
console.log(`✓ ${employees.length}명 변환 완료 → ${outputPath}`);
console.log(`  팀: ${[...new Set(employees.map((e) => e.team))].join(", ")}`);
