# SPEAKZEN

원익 임직원 SPA(Speaking Proficiency Assessment) 영어 말하기 학습 웹앱.

- 유형별 학습 (질문 듣기 → 음성 답변 → AI 채점 → 상세 리포트)
- 모의고사 및 종합 결과지
- 불꽃(연속 학습일) 랭킹
- 본인 시험 일정 조회
- 관리자 통계 (부서별 참여율)

## 시작하기

**처음 세팅한다면 [SETUP.md](./SETUP.md) 를 먼저 읽어주세요.**
AI 게이트웨이 주소, 관리자 계정, 임직원 명부는 반드시 교체해야 합니다.

```bash
npm install --legacy-peer-deps
npm run dev
```

## 기술 스택

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Cloudflare Pages + KV · Web Speech API
