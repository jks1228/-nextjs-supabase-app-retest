# [CLAUDE.md](http://CLAUDE.md)

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

공식 Next.js + Supabase 스타터킷(`with-supabase` 템플릿)이며, 업스트림 대비 거의 수정되지 않았습니다.
유일한 커스텀 추가 사항은 `app/intruments/page.tsx`로, Server Component에서 Supabase의
`profiles`/`instruments` 테이블을 조회합니다.

## 명령어

```bash
npm run dev      # Next.js 개발 서버 (Turbopack), localhost:3000
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 빌드 실행
npm run lint     # eslint . (eslint-config-next 기반 flat config)
```

`package.json`에 테스트 러너가 구성되어 있지 않습니다 (`test` 스크립트 없음, 저장소 내 테스트 파일 없음).

Supabase 타입은 Supabase MCP 서버의 `generate_typescript_types` 툴(또는 Supabase CLI)로
`lib/supabase/database.types.ts`에 재생성합니다 — 이 파일은 직접 수정하지 마세요.

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

## `docs/guides/*`는 이 저장소에 대한 신뢰할 수 있는 문서가 아님

`docs/` 디렉터리(미추적, untracked)는 이 저장소와 전혀 다른, 더 큰 프로젝트를 설명합니다 — `src/`
구조, `/admin` 영역, `lib/auth/*` 기반 커스텀 인증, CI 워크플로우를 갖춘 Notion 연동 인보이스 앱입니다.
이 체크아웃에는 그런 것이 전혀 없습니다 (`src/` 없음, `/admin` 없음, Notion 연동 없음, `ROADMAP.md`
없음). `docs/guides/project-structure.md`, `nextjs-16.md`, `deployment.md`, `regression-testing.md`를
이 코드베이스에 대한 지침으로 따르지 마세요 — 다른 프로젝트에서 그대로 가져온 것으로 보입니다. Next.js
16 관련 세부사항이 필요하면 문서 대신 이 저장소의 실제 파일(`proxy.ts`, `next.config.ts` 등)을 기준으로
확인하세요.