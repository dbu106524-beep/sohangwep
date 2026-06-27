# 운영용 보안 아키텍처 제안

## 왜 정적 HTML만으로는 부족한가

GitHub Pages는 정적 파일을 제공하는 용도입니다. 관리자 로그인 로직을 JavaScript에 넣으면 누구나 코드를 읽고 우회할 수 있습니다. 따라서 “관리자는 쓰기 가능, 유저는 읽기만 가능” 같은 규칙은 서버 또는 DB에서 검사해야 합니다.

## 권장 구성 A: GitHub Pages + Supabase

```text
유저 브라우저
  ├─ GitHub Pages 정적 HTML/CSS/JS
  └─ Supabase Auth + Postgres RLS 호출
```

장점:

- GitHub Pages는 그대로 무료 정적 호스팅으로 사용
- Discord 소셜 로그인 연동 가능
- 게시글/상품/가이드 데이터는 Postgres에 저장
- Row Level Security로 공개 데이터만 읽기, 관리자만 쓰기 제한 가능

관리자 판별 예시:

- Supabase `profiles` 테이블에 `role = 'admin'` 부여
- 본인 계정의 `auth.users.id`, Discord ID, Minecraft UUID를 관리자 목록에 등록
- DB 정책에서 `is_admin()` 함수로 쓰기 권한 확인

## 권장 구성 B: GitHub Pages + Cloudflare Worker + DB

```text
유저 브라우저
  ├─ GitHub Pages 정적 페이지
  └─ Cloudflare Worker API
          ├─ Discord OAuth callback
          ├─ Microsoft/Minecraft OAuth callback
          ├─ 관리자 세션 쿠키 발급
          └─ DB 쓰기/읽기 API
```

장점:

- OAuth Client Secret을 Worker Secret에 저장 가능
- 관리자 API를 서버에서 완전히 차단 가능
- GitHub 저장소에 비밀값을 넣지 않아도 됨

## Discord 로그인

운영에서는 다음 흐름을 권장합니다.

1. 사용자가 Discord 로그인 클릭
2. 서버가 `state` 값을 만들고 OAuth 인증 URL로 리디렉션
3. Discord가 `code`와 `state`를 콜백 URL로 반환
4. 서버가 `state` 검증
5. 서버가 Client Secret으로 code를 token으로 교환
6. Discord 사용자 ID 확인
7. DB 프로필 생성/업데이트
8. 관리자 ID와 일치하면 관리자 세션 또는 role 부여

## Minecraft/Microsoft 로그인

Azure 앱 ID를 이미 받았다면 운영에서는 다음을 서버에서 처리하세요.

1. Microsoft OAuth Authorization Code 흐름으로 로그인
2. 서버에서 토큰 교환
3. Xbox Live/XSTS/Minecraft 프로필 검증
4. Minecraft UUID를 DB 프로필과 연결
5. 관리자 UUID인지 확인

Client Secret과 token exchange는 브라우저 JavaScript에 넣지 마세요.

## 데이터 모델

`docs/supabase-schema.sql`에 기본 테이블과 RLS 정책 예시가 들어 있습니다.

- `profiles` — 유저 프로필, 관리자 role
- `posts` — 공지/업데이트/이벤트
- `guide_categories` — 가이드 카테고리
- `guides` — 가이드 문서
- `products` — 상점 상품
- `site_settings` — 사이트 설정

## 운영 배포 순서

1. 현재 프로토타입으로 디자인과 관리 흐름 확인
2. Supabase 프로젝트 생성
3. `docs/supabase-schema.sql` 적용
4. Discord Auth 또는 Worker OAuth 연결
5. 본인 계정만 `profiles.role = 'admin'`으로 변경
6. 프론트엔드의 localStorage 저장 로직을 Supabase API 호출로 교체
7. GitHub Pages에 배포
8. 커스텀 도메인 + HTTPS 적용
