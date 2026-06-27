# 보안 메모

## 핵심 결론

GitHub Pages만으로는 “관리자 화면은 나만 접근”을 안전하게 보장할 수 없습니다. GitHub Pages는 HTML/CSS/JS 파일을 그대로 제공하는 정적 호스팅이므로, 브라우저에서 실행되는 로그인 체크는 우회될 수 있습니다.

## 이 프로토타입의 관리자 화면

`admin.html`은 로컬 테스트를 쉽게 하기 위한 UI입니다.

- 관리자 비밀번호를 코드에 하드코딩하지 않았습니다.
- 첫 실행 시 입력한 비밀번호는 Web Crypto PBKDF2 해시로 브라우저 로컬 저장소에 보관됩니다.
- 하지만 로컬 저장소와 클라이언트 JavaScript는 사용자가 조작할 수 있으므로 운영 보안 수단으로 쓰면 안 됩니다.

## 운영에서 필요한 구조

권장 구조:

```text
GitHub Pages 정적 프론트엔드
        |
        | Supabase JS 또는 HTTPS API 호출
        v
Supabase Auth / Cloudflare Worker / Vercel Function
        |
        | 서버 또는 DB에서 관리자 권한 검사
        v
Postgres DB + Row Level Security
```

필수 보호:

1. 게시글/상품/가이드 쓰기 API는 서버 또는 DB 권한 정책으로 관리자만 허용합니다.
2. 유저는 공개된 `published` 데이터만 읽을 수 있게 합니다.
3. Discord/Microsoft OAuth의 Client Secret은 서버 환경 변수나 Secret 저장소에 둡니다.
4. 관리자 판별은 이메일/Discord ID/Minecraft UUID 같은 검증된 계정 ID 기준으로 합니다.
5. 결제와 상품 지급은 클라이언트 요청만 믿지 말고 서버에서 검증합니다.

## 노출된 비밀번호 처리

채팅, 문서, Git 커밋, 스크린샷에 한 번이라도 적은 비밀번호는 이미 노출된 것으로 간주하고 운영에서는 새 비밀번호를 사용하세요.

## Git에 올리면 안 되는 파일 예시

```text
.env
.env.local
.dev.vars
secrets.json
admin-password.txt
service-role-key.txt
azure-client-secret.txt
discord-client-secret.txt
```

`.gitignore`에 위 파일들을 추가하는 것을 권장합니다.
