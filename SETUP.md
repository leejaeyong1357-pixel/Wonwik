# SPEAKZEN (원익) 초기 세팅 가이드

SPA 영어 말하기 학습 웹앱. 이 문서 순서대로 진행하면 처음부터 운영까지 가능합니다.

> 이 저장소는 **코드만** 복제된 상태입니다. 임직원 명부·시험일정은 비어 있고,
> AI 게이트웨이 주소와 관리자 계정은 **반드시 교체**해야 합니다.

---

## ⚠️ 운영 전 필수 교체 항목 (5개)

| # | 항목 | 파일 | 현재 값 |
|---|---|---|---|
| 1 | Anthropic API 키 | Cloudflare 환경변수 | `ANTHROPIC_API_KEY` 미설정 |
| 2 | 관리자 계정 | `app/login/page.tsx` | `wonikadmin` / `wonik2026!` |
| 3 | 임직원 명부 | `data/employees.json` | 빈 배열 |
| 4 | 시험 일정 | `data/exam_schedules.json` | 빈 객체 |
| 5 | 로고 | `public/brand-logo.svg` | 임시 텍스트 로고 |

---

## 1. Anthropic API 키 설정

AI 채점은 **Claude API** 를 직접 호출합니다. 사내 게이트웨이나 터널이 필요 없습니다.

1. [console.anthropic.com](https://console.anthropic.com) → **API Keys** → 키 발급
2. Cloudflare Pages → 프로젝트 → **Settings** → **Variables and Secrets** → **Add**
   - Variable name: **`ANTHROPIC_API_KEY`**
   - Value: 발급받은 키
   - Type: **Secret** ← 반드시 Secret 으로 (Plaintext 금지)
3. Save → **Retry deployment**

> 🔐 키는 **서버에만** 존재하며 브라우저로 내려가지 않습니다.
> 학습자는 개인 키를 발급받을 필요가 없고, 설정 화면에도 키 입력란이 없습니다.

### 비용 관리

전 사용자의 채점이 **이 키 하나로** 청구됩니다. 다음을 권장합니다.

- Anthropic Console → **Limits** 에서 월 사용 한도를 설정
- 이 앱 전용 키를 따로 발급 (다른 용도와 분리해 사용량 추적)
- 채점 루브릭에 **프롬프트 캐싱**이 적용되어 있어 반복 채점 시 입력 비용이 크게 절감됩니다

### 모델 변경

`lib/constants.ts` 의 `DEFAULT_MODEL` 로 조정합니다.

| 모델 | 특징 |
|---|---|
| `claude-opus-5` | 기본값. 가장 정확한 채점 |
| `claude-sonnet-5` | 빠르고 저렴 |
| `claude-haiku-4-5` | 가장 저렴 |

## 2. 관리자 계정 변경

기본 계정은 `wonikadmin` / `wonik2026!` 입니다. **반드시 바꾸세요.**

새 계정의 해시를 생성합니다.

```bash
node -e "const c=require('crypto');const h=s=>c.createHash('sha256').update(s).digest('hex');console.log('ID:',h('원하는아이디'));console.log('PW:',h('원하는비밀번호'));"
```

출력된 두 값을 `app/login/page.tsx` 의 `ADMINS` 배열에 넣습니다.

```ts
const ADMINS = [
  {
    idH: "여기에 ID 해시",
    pwH: "여기에 PW 해시",
    name: "관리자",
  },
];
```

> 비밀번호는 해시로만 저장되어 **분실 시 복구가 불가능**합니다. 별도로 안전하게 보관하세요.

---

## 3. 임직원 명부 입력

`data/employees.json` 의 `employees` 배열을 채웁니다.

```json
{
  "employees": [
    {
      "no": 1,
      "team": "인사팀",
      "position": "매니저",
      "employeeId": "12345678",
      "name": "홍길동",
      "grade": "G3"
    }
  ]
}
```

- 로그인 시 **이름 + 사번** 일치 여부만 검증합니다
- 이 파일은 서버(`/api/auth/login`)에서만 읽으며 **클라이언트로 전송되지 않습니다**
- ⚠️ 주민번호 등 민감정보는 **절대 넣지 마세요**
- ⚠️ 클라이언트 컴포넌트에서 이 파일을 import 하면 **명부 전체가 유출**됩니다

---

## 4. 시험 일정 입력 (선택)

`data/exam_schedules.json` 에 사번을 키로 입력합니다. 로그인하면 **본인 일정만** 표시됩니다.

```json
{
  "schedules": {
    "12345678": {
      "date": "2026-07-06",
      "time": "13:20",
      "name": "홍길동",
      "location": "○○사업장 대회의실",
      "factory": "○○사업장",
      "seq": 1
    }
  }
}
```

일정이 없으면 대시보드에 "확정된 시험 일정이 없습니다"로 표시됩니다.

---

## 5. Cloudflare Pages 배포

### 5-1. 저장소 연결

1. [Cloudflare 대시보드](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages**
2. **Connect to Git** → 이 저장소 선택
3. 빌드 설정:

| 항목 | 값 |
|---|---|
| Framework preset | **None** |
| Build command | `npx @cloudflare/next-on-pages@1` |
| Build output directory | `.vercel/output/static` |
| Production branch | `main` |

### 5-2. 호환성 플래그 (필수)

Settings → **Runtime** → Compatibility flags 에 **`nodejs_compat`** 추가
(Production, Preview 모두)

> 이 설정을 빠뜨리면 배포는 되지만 실행 시 오류가 납니다.

### 5-3. KV 저장소 연결 (필수)

1. **Storage & Databases** → **KV** → **Create Instance** → 이름 예: `wonik-spa`
2. Pages 프로젝트 → Settings → **Bindings** → **Add** → **KV namespace**
   - Variable name: **`SPA_KV`** ← 정확히 이 이름
   - KV namespace: 방금 만든 것 선택
3. Save → **Retry deployment**

> `SPA_KV` 가 없으면 설정 동기화·불꽃 랭킹·PDF 업로드가 **조용히 동작하지 않습니다** (에러 없음).

### 5-4. 환경변수

Settings → **Variables and Secrets**

| 이름 | 값 | 용도 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API 키 | **필수** · Secret 타입 |
| `GATE_USER` | 원하는 아이디 | 사이트 진입 1차 잠금 (선택) |
| `GATE_PASS` | 원하는 비밀번호 | 〃 |
| `MAINTENANCE` | `0` 또는 `1` | `1`이면 전체 503 점검 화면 |

> `GATE_USER`/`GATE_PASS` 를 설정하지 않으면 1차 잠금 없이 바로 로그인 화면이 나옵니다.

---

## 6. 배포 및 로컬 개발

### 코드 수정 후 배포

```bat
UPDATE.bat 더블클릭
```

또는 직접:

```bash
git add -A && git commit -m "수정 내용" && git push origin main
```

Cloudflare가 자동으로 재배포합니다 (3~5분).

### 로컬 개발

```bash
npm install --legacy-peer-deps    # --legacy-peer-deps 없으면 의존성 충돌
npm run dev                        # http://localhost:3000
npm run build                      # 배포 전 검증 (반드시 통과 확인)
npx tsc --noEmit                   # 타입 검사
```

---

## 7. 알아두면 좋은 것

### 기능 요약

- **학습**: 유형 1~4, 질문 듣기(TTS) → 음성 답변(STT) → AI 채점 → 상세 리포트
- **모의고사**: 4유형 연속 응시 → 종합 결과지
- **불꽃**: 연속 학습일 레벨. 매일 하면 상승, 하루 빠지면 하락
- **시험 일정**: 본인 일정만 표시
- **관리자**: 부서별 참여율, 비밀번호 초기화, PDF 가이드 업로드

### 개인정보 설계 원칙

학습자에게 공지로 약속한 내용입니다. **변경하려면 재동의가 필요합니다.**

- 개인 점수·답변은 **본인 기기(localStorage)** 에만 저장
- 서버(KV)에는 부서별 집계와 설정만 저장
- 관리자 화면에 개인 점수·답변이 노출되지 않음

### 기술적 함정

| 항목 | 주의 |
|---|---|
| **Edge Runtime** | 모든 API에 `export const runtime = "edge"` 필수. Node 전용 API 사용 불가 |
| **설정 동기화** | `lib/userSync.ts` 의 `mergeSettings` 는 필드별 병합. 단순 스프레드로 바꾸면 **API 키가 덮어써짐** |
| **음성 인식** | `lib/speech.ts` 는 엔진 인스턴스를 항상 1개만 유지. 건드리면 모바일에서 같은 단어가 반복 입력됨 |
| **사내망 마이크** | 브라우저 음성 인식은 외부 음성 서버 사용. 사내망 차단 시 `network` 오류 → 직접 입력으로 안내 |
| **CSS 토큰** | 색상 클래스는 `brand-*` (예: `brand-navy`). 정의는 `tailwind.config.js` |

### 자주 겪는 문제

| 증상 | 해결 |
|---|---|
| 503 점검 화면 | `MAINTENANCE` 환경변수를 `0` 으로 설정 |
| AI 채점이 인증 실패 | `ANTHROPIC_API_KEY` 값 확인 후 Retry deployment |
| 기기 간 연동 안 됨 | `SPA_KV` 바인딩 확인 |
| 배포 후 화면 그대로 | 브라우저 강제 새로고침 `Ctrl + Shift + R` |
| `npm install` 실패 | `--legacy-peer-deps` 옵션 사용 |

---

## 8. 세팅 체크리스트

- [ ] Cloudflare 환경변수 `ANTHROPIC_API_KEY` 등록 (Secret)
- [ ] `app/login/page.tsx` — 관리자 계정 해시 교체
- [ ] `data/employees.json` — 임직원 명부 입력
- [ ] `data/exam_schedules.json` — 시험 일정 입력 (선택)
- [ ] `public/brand-logo.svg` — 회사 로고 교체
- [ ] Cloudflare Pages 프로젝트 생성 + 빌드 설정
- [ ] `nodejs_compat` 호환성 플래그 추가
- [ ] `SPA_KV` KV 바인딩 연결
- [ ] 환경변수 설정
- [ ] 배포 후 로그인 → 학습 → AI 채점 전체 흐름 확인
- [ ] Anthropic Console 에서 월 사용 한도 설정
