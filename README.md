# Hello Word

공포 컨셉 영어 단어 암기 게임 · HTML / CSS / Vanilla JS + Supabase

팀: 2110 임지수, 2111 장하은

## 실행 방법

1. Supabase SQL Editor에서 `docs/Schema.sql` 실행
   - 테이블이 이미 있으면 **2번(ALTER)부터** 실행
   - Authentication → Sign In / Providers → Email → **Confirm email 끄기** (개발 중)
2. `js/core/Config.js`에 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 입력
3. Figma `Assets` 페이지에서 에셋 Export → `assets/` 폴더에 넣기
4. 사운드 7개를 `assets/sounds/`에 넣기 (없어도 게임은 돌아감)
5. VS Code **Live Server**로 `index.html` 열기
   (ES Module이라 파일 더블클릭(file://)으로는 안 열림)

## 폴더

```
html/    페이지 9개 (PascalCase + Page.html)
css/     Reset · Tokens · Common · Layout + 페이지별
js/core  Config, SupabaseClient, Auth, Router, Utils, Audio, Layout
js/api   Supabase 쿼리만 (ProfileApi, WordbookApi, WordApi, RecordApi, SettingsApi)
js/components  WordbookModal, DropdownMenu, Toast
js/pages HTML과 같은 이름의 진입 JS
js/game  GameEffects (게임 연출)
assets/  images · logo · icons · sounds
docs/    Schema.sql
```

## 브랜치 규칙

- `main` 제출용 ← `develop` 통합 ← `feature/기능명` (예: `feature/Login`)
- 버그 수정: `fix/내용`
- 커밋: `feat:` `fix:` `style:` `docs:`
- 파일명 대소문자 정확히! (GitHub Pages는 대소문자 구분)
