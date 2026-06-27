# 소행성 정적 홈페이지

`asteroid-expedition-site.zip`을 참고해서 만든 로컬 확인용 정적 사이트입니다. 서버 없이 `HTML/CSS/JS`만으로 메인, 공지사항, 업데이트, 이벤트, 가이드, 상점, 관리자 화면을 볼 수 있습니다.

## 바로 열어보기

[index.html](C:\Users\game-\OneDrive\Desktop\asteroid_app\index.html)을 더블클릭하면 됩니다.

로컬 파일 제한이 있으면 간이 서버로 열 수 있습니다.

```powershell
cd C:\Users\game-\OneDrive\Desktop\asteroid_app
node -e "const http=require('http'),fs=require('fs'),path=require('path');const root=process.cwd();const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.md':'text/plain; charset=utf-8','.png':'image/png'};http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');let p=path.join(root,u.pathname==='/'?'index.html':u.pathname);if(!p.startsWith(root))return res.writeHead(403).end('Forbidden');fs.readFile(p,(e,d)=>{if(e)return res.writeHead(404).end('Not found');res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});res.end(d);});}).listen(8080,()=>console.log('http://localhost:8080/index.html'))"
```

## 페이지 구성

- [index.html](C:\Users\game-\OneDrive\Desktop\asteroid_app\index.html): 메인 화면
- [notice.html](C:\Users\game-\OneDrive\Desktop\asteroid_app\notice.html): 공지사항
- [updates.html](C:\Users\game-\OneDrive\Desktop\asteroid_app\updates.html): 업데이트
- [events.html](C:\Users\game-\OneDrive\Desktop\asteroid_app\events.html): 이벤트
- [about.html](C:\Users\game-\OneDrive\Desktop\asteroid_app\about.html): 가이드
- [shop.html](C:\Users\game-\OneDrive\Desktop\asteroid_app\shop.html): 상점
- [admin.html](C:\Users\game-\OneDrive\Desktop\asteroid_app\admin.html): 로컬 관리자 UI

## 디스코드 참여

일반 유저 로그인 기능은 제거했습니다. 상단 `가입하기`와 메인 `소행성 디스코드 참여하기` 버튼은 바로 Discord 초대 링크로 이동합니다.

현재 연결된 초대 링크:

```text
https://discord.gg/ju5YCandvB
```

## 메인 NEW 배너

메인 화면의 `NEW` 배너는 고정 문구가 아니라 공개된 글 중 `updatedAt` 또는 `createdAt` 기준으로 가장 최신 글을 자동 표시합니다. 관리자 화면에서 새 공지, 업데이트, 이벤트를 작성하거나 수정하면 최신 글이 바뀝니다.

## 상점

기본 상품은 비워두었습니다. [admin.html](C:\Users\game-\OneDrive\Desktop\asteroid_app\admin.html)의 `상점 상품` 탭에서 직접 상품을 추가하면 [shop.html](C:\Users\game-\OneDrive\Desktop\asteroid_app\shop.html)에 표시됩니다.

상품 이미지는 URL 입력이 아니라 파일 업로드 방식입니다. 업로드한 이미지는 자동 축소 후 브라우저 `localStorage`에 저장됩니다. 실제 운영에서는 Supabase Storage 같은 파일 저장소와 DB URL 저장 방식을 권장합니다.

## 주요 파일

- [assets/css/style.css](C:\Users\game-\OneDrive\Desktop\asteroid_app\assets\css\style.css): 전체 디자인과 반응형 스타일
- [assets/img](C:\Users\game-\OneDrive\Desktop\asteroid_app\assets\img): 고퀄리티 우주/마인크래프트풍 PNG 에셋
- [assets/js/data.js](C:\Users\game-\OneDrive\Desktop\asteroid_app\assets\js\data.js): 기본 샘플 데이터
- [assets/js/store.js](C:\Users\game-\OneDrive\Desktop\asteroid_app\assets\js\store.js): `localStorage` 저장, 관리자 인증 데모, 데이터 편집 함수
- [assets/js/site.js](C:\Users\game-\OneDrive\Desktop\asteroid_app\assets\js\site.js): 사이트 화면 렌더링
- [assets/js/admin.js](C:\Users\game-\OneDrive\Desktop\asteroid_app\assets\js\admin.js): 관리자 화면 렌더링과 폼 처리
- [tools/verify-static.js](C:\Users\game-\OneDrive\Desktop\asteroid_app\tools\verify-static.js): 정적 파일 참조와 페이지 응답 검증

## 관리자 화면

관리자 링크는 상단 메뉴에서 제거했고, 하단 푸터의 `관리자 로그인`으로만 접근합니다.

1. [admin.html](C:\Users\game-\OneDrive\Desktop\asteroid_app\admin.html)을 엽니다.
2. 첫 접속 때 관리자 ID와 8자 이상의 비밀번호를 등록합니다.
3. 공지사항, 업데이트, 이벤트, 가이드, 상점 상품, 사이트 문구를 수정합니다.
4. 백업/복원 탭에서 JSON으로 내보내거나 다시 불러올 수 있습니다.
