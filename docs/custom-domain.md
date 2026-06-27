# GitHub Pages 커스텀 도메인 연결 가이드

## 1. 도메인 형태 결정

권장 형태:

```text
www.내도메인.한국
```

그리고 루트 도메인:

```text
내도메인.한국
```

도 함께 연결하면 사용자가 둘 중 어디로 들어와도 사이트가 열립니다.

## 2. 한국어 도메인을 Punycode로 변환

GitHub Pages 설정에는 국제화 도메인을 Punycode로 입력해야 할 수 있습니다.

로컬에서 변환:

```bash
python - <<'PY'
domain = '내도메인.한국'
print(domain.encode('idna').decode())
print(('www.' + domain).encode('idna').decode())
PY
```

출력된 값을 GitHub Pages의 Custom domain, DNS 레코드, `CNAME` 파일에 사용합니다.

## 3. GitHub 저장소 설정

1. GitHub 저장소로 이동
2. `Settings > Pages`
3. `Custom domain`에 Punycode 도메인 입력
4. `Save`
5. DNS 확인이 끝난 뒤 `Enforce HTTPS` 활성화

## 4. DNS 레코드 설정

DNS 업체의 관리 화면에서 설정합니다.

### www 서브도메인을 쓰는 경우

```text
Type: CNAME
Name/Host: www
Value/Target: <GitHub아이디>.github.io
```

### 루트 도메인을 같이 쓰는 경우

GitHub Pages의 A 레코드 대상 IP를 DNS에 등록합니다. GitHub 공식 문서의 최신 IP를 확인해 넣으세요.

보통 아래 형태입니다.

```text
Type: A
Name/Host: @
Value/Target: GitHub Pages A record IP
```

그리고 `www`와 루트 도메인이 서로 리디렉션되도록 GitHub Pages의 도메인 설정과 DNS를 맞춥니다.

## 5. CNAME 파일

저장소 루트에 `CNAME` 파일을 만들고 도메인 한 줄만 넣습니다.

```text
www.xn--example-punycode
```

주의:

- 파일명은 반드시 `CNAME`
- 한 파일에는 도메인 하나만
- 설명, 주석, 공백 줄 없이 도메인만

## 6. 확인

DNS 전파에는 시간이 걸릴 수 있습니다. 연결 후 다음을 확인하세요.

- `https://도메인` 접속 가능
- GitHub Pages에서 HTTPS 인증서 발급 완료
- `Enforce HTTPS` 활성화
- 기존 `github.io` 주소에서 커스텀 도메인으로 리디렉션
