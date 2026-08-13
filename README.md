# 나의 첫 AI 앱

Next.js와 Anthropic API(Claude)로 만든 간단한 AI 챗봇입니다.

## 기술 스택

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS
- [@anthropic-ai/sdk](https://github.com/anthropics/anthropic-sdk-typescript)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 만들고 Anthropic API 키를 추가하세요.

```
ANTHROPIC_API_KEY=여기에_API_키_입력
```

API 키는 [console.anthropic.com](https://console.anthropic.com)에서 발급받을 수 있습니다. `.env.local`은 `.gitignore`에 포함되어 있어 git에 커밋되지 않습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
app/
  api/chat/route.ts   # Claude API를 호출하는 서버 라우트 (API 키는 서버에서만 사용)
  page.tsx            # 채팅 UI (입력창, 대화 내역, 로딩/에러 상태)
```
