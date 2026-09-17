# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

공식 Next.js + Supabase 스타터킷(`with-supabase` 템플릿)이며, 업스트림 대비 거의 수정되지 않았습니다.
유일한 커스텀 추가 사항은 `app/intruments/page.tsx`로, Server Component에서 Supabase의
`profiles`/`instruments` 테이블을 조회합니다.

## 명령어

```bash
npm run dev                    # Next.js 개발 서버 (Turbopack), localhost:3000
npm run build                  # 프로덕션 빌드
npm run start                  # 프로덕션 빌드 실행
npm run lint                   # eslint . (eslint-config-next 기반 flat config)
npx tsc --noEmit                # 타입 체크 (package.json에 별도 스크립트 없음)
npx shadcn@latest add <name>    # shadcn/ui 컴포넌트 추가 (components/ui/*는 이 명령으로만 갱신)
```

`package.json`에 테스트 러너가 구성되어 있지 않습니다 (`test` 스크립트 없음, 저장소 내 테스트 파일 없음).

Supabase 타입은 Supabase MCP 서버의 `generate_typescript_types` 툴(또는 Supabase CLI의
`supabase gen types typescript`)로 `lib/supabase/database.types.ts`에 재생성합니다 — 이 파일은
직접 수정하지 마세요.

## 코딩 컨벤션

전역 사용자 가이드(`C:\Users\user\.claude\CLAUDE.md`)의 핵심 규칙 중 이 저장소에 적용되는 부분입니다.

- **함수/변수명은 영어**로 작성 (camelCase), 컴포넌트명은 PascalCase, 파일명은 kebab-case
- **들여쓰기 2칸, 작은따옴표, 세미콜론 미사용** — 기존 코드 스타일과 통일
- **TypeScript strict mode 준수, `any` 금지** — 함수 반환값과 props 타입을 명시적으로 작성
- **주석은 한국어로, 최소한만** — 코드가 이미 말해주는 "무엇을"이 아니라 "왜"가 비자명할 때만 한 줄
  작성 (숨은 제약, 미묘한 불변 조건, 특정 버그 우회 등). 예: `lib/supabase/server.ts`의 클라이언트를
  모듈 싱글턴으로 두면 안 되는 이유 같은 부분
- **`.md` 문서 파일은 모두 한국어로 작성** — 이 `CLAUDE.md`를 포함해 `docs/` 하위 문서 전부 해당.
  코드 식별자·명령어 등은 원문(영어) 그대로 유지
- **커밋 메시지는 한국어**, `<타입>: <설명>` 형식 (`feat`, `fix`, `refactor`, `docs`, `style`,
  `perf`, `chore`)

## 환경 변수

`.env.local`에 다음이 필요합니다:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`lib/utils.ts`는 `hasEnvVars`를 export하며, 여러 컴포넌트(`EnvVarWarning`, proxy)가 이 값이 설정되지
않았을 때 정상적으로 성능이 저하되도록(graceful degradation) 사용합니다.

## 아키텍처

**Next.js 16 App Router**, TypeScript strict mode, Tailwind CSS v3 + shadcn/ui ("new-york" 스타일,
`components.json` 참고). 경로 별칭 `@/*` → 프로젝트 루트 (`tsconfig.json` 참고).

### 요청 가로채기: `middleware.ts`가 아니라 `proxy.ts`

Next.js 16에서 미들웨어 관례 이름이 바뀌었습니다. 루트의 `proxy.ts`가 `proxy(request)`를 export하고,
`lib/supabase/proxy.ts`의 `updateSession()`으로 위임합니다. 이 함수는 `supabase.auth.getClaims()`로
Supabase 세션을 갱신하고, `/`, `/login*`, `/auth*`를 제외한 경로에 대한 미인증 요청을 리다이렉트합니다.
새로운 공개 라우트를 추가할 때는 `proxy.ts`가 아니라 `lib/supabase/proxy.ts`의 pathname 체크 부분을
수정하세요.

### 세 가지로 분리된 Supabase 클라이언트 생성 방식

SSR 쿠키 처리 방식 때문에 Supabase 클라이언트를 얻는 방법이 세 가지로 분리되어 있습니다 — 항상 맥락에
맞는 것을 사용하세요:

- `lib/supabase/client.ts` — `createClient()`, 브라우저/Client Components (`createBrowserClient`)
- `lib/supabase/server.ts` — `async createClient()`, Server Components/Actions/Route Handlers
  (`createServerClient`, `next/headers`로 쿠키 읽기/쓰기). 파일 내 주석에 따르면 이 클라이언트를 모듈
  레벨 싱글턴으로 끌어올리면 안 됩니다 — 항상 요청/핸들러 내부에서 새로 생성하세요.
- `lib/supabase/proxy.ts` — `updateSession()`, `proxy.ts`에서만 사용

세 클라이언트 모두 `lib/supabase/database.types.ts`의 `Database` 타입으로 타입이 지정되어 있습니다.

### 인증 페이지 vs. 보호된 페이지

- `app/auth/*` — 로그인, 회원가입, 비밀번호 찾기/변경, 이메일 확인 라우트, 에러 페이지. 폼은
  `components/*-form.tsx`에서 Client Component로 로컬 `useState`를 사용하며, React Hook Form/Zod는
  사용하지 않습니다 (`docs/guides/forms-react-hook-form.md`의 설명과 다름 — 해당 가이드는 이
  코드베이스를 반영하지 않습니다. 아래 참고).
- `app/protected/*` — `proxy.ts`로 보호됨. `app/protected/layout.tsx`가 공통 네비/푸터
  (`DeployButton`, `AuthButton`, `ThemeSwitcher`)를 렌더링하고, `app/protected/page.tsx`가 인증된
  사용자의 claims를 읽습니다.

### shadcn/ui 컴포넌트

`components/ui/*`는 shadcn으로 생성된 프리미티브입니다 — 직접 작성한 코드가 아니라 벤더링된 코드로
취급하세요. 관례를 임의로 수정하기보다 `npx shadcn@latest add <name>`으로 재생성/확장하세요.

## 보안 원칙

전역 가이드의 보안 원칙 중 이 저장소(Supabase + Server Actions 기반)에 실질적으로 적용되는 항목입니다.

- 민감 정보는 `.env.local`에만 저장하고, `NEXT_PUBLIC_` 접두사는 클라이언트에 노출해도 되는 값에만
  사용 (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`가 그 예)
- 데이터 변경은 Server Actions/Route Handler 등 서버 쪽에서 처리 — 브라우저 Supabase 클라이언트에서
  직접 쓰기 작업을 하더라도 Supabase RLS(Row Level Security) 정책으로 접근을 제어
- 사용자 입력은 검증 후 사용 (이 저장소의 인증 폼은 현재 자체 `useState` 검증만 하며 Zod를 쓰지 않음 —
  새로 폼을 추가할 때는 Zod 도입을 고려)
- XSS 방지는 React의 자동 이스케이프에 의존 — `dangerouslySetInnerHTML` 사용 지양

## `docs/guides/*`는 이 저장소에 대한 신뢰할 수 있는 문서가 아님

`docs/` 디렉터리(미추적, untracked)는 이 저장소와 전혀 다른, 더 큰 프로젝트를 설명합니다 — `src/`
구조, `/admin` 영역, `lib/auth/*` 기반 커스텀 인증, CI 워크플로우를 갖춘 Notion 연동 인보이스 앱입니다.
이 체크아웃에는 그런 것이 전혀 없습니다 (`src/` 없음, `/admin` 없음, Notion 연동 없음, `ROADMAP.md`
없음). `docs/guides/project-structure.md`, `nextjs-16.md`, `deployment.md`, `regression-testing.md`를
이 코드베이스에 대한 지침으로 따르지 마세요 — 다른 프로젝트에서 그대로 가져온 것으로 보입니다. Next.js
16 관련 세부사항이 필요하면 문서 대신 이 저장소의 실제 파일(`proxy.ts`, `next.config.ts` 등)을 기준으로
확인하세요.
