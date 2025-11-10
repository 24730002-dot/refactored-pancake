# Pet Friendly 배포 가이드

## 🔐 환경 변수 설정

프로덕션 배포 전 반드시 환경 변수를 설정해야 합니다.

### 로컬 개발 환경

1. `.env.example` 파일을 `.env`로 복사:
```bash
cp .env.example .env
```

2. `.env` 파일에 실제 Supabase 키 입력:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

3. 개발 서버 재시작

### 프로덕션 배포

#### Vercel 배포
1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 다음 변수 추가:
   - `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase Anonymous Key

#### Netlify 배포
1. Netlify 대시보드 → Site settings
2. Build & deploy → Environment
3. Environment variables 섹션에서 변수 추가:
   - `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase Anonymous Key

#### GitHub Pages / 기타 플랫폼
1. Repository Settings → Secrets and variables → Actions
2. New repository secret 클릭
3. 필요한 변수들 추가

## 🗄️ Supabase 데이터베이스 설정

배포 전 Supabase 데이터베이스를 설정해야 합니다.

### 1. Supabase 프로젝트 생성
1. [Supabase](https://supabase.com) 가입 및 로그인
2. New Project 클릭
3. 프로젝트 이름, 비밀번호, 리전 선택

### 2. 데이터베이스 스키마 적용
`database_schema.md` 파일의 SQL 명령어를 Supabase SQL Editor에서 실행:

1. Supabase 대시보드 → SQL Editor
2. New query 클릭
3. `database_schema.md`의 SQL 코드 복사 & 실행

### 3. Storage 버킷 생성
1. Supabase 대시보드 → Storage
2. 다음 버킷 생성:
   - `profile_photos` (공개)
   - `review_images` (공개)
   - `backgrounds` (공개)

### 4. Row Level Security (RLS) 정책 확인
모든 테이블에 RLS가 활성화되어 있는지 확인하고, `database_schema.md`의 정책들이 적용되었는지 확인합니다.

## 🔒 보안 체크리스트

배포 전 다음 사항들을 확인하세요:

- [ ] 환경 변수가 모두 설정되었는가?
- [ ] `.env` 파일이 `.gitignore`에 추가되었는가?
- [ ] Supabase RLS 정책이 올바르게 설정되었는가?
- [ ] 디버깅 로그가 모두 제거되었는가?
- [ ] API 키가 코드에 하드코딩되지 않았는가?

## 🚀 배포 단계

### 1. 빌드 테스트
```bash
npm run build
```

### 2. 로컬에서 프로덕션 빌드 테스트
```bash
npm run preview
```

### 3. 배포
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

## 📊 배포 후 체크리스트

- [ ] 모든 페이지가 정상 작동하는가?
- [ ] 로그인/회원가입이 작동하는가?
- [ ] 이미지 업로드가 작동하는가?
- [ ] 데이터베이스 읽기/쓰기가 작동하는가?
- [ ] 모바일 화면에서 정상 작동하는가?
- [ ] 브라우저 콘솔에 에러가 없는가?

## 🔧 문제 해결

### 환경 변수가 적용되지 않을 때
- 빌드를 다시 실행하세요
- 배포 플랫폼의 환경 변수 설정을 다시 확인하세요
- 변수 이름 앞에 `VITE_` 접두사가 있는지 확인하세요

### Supabase 연결 오류
- Supabase URL과 키가 정확한지 확인하세요
- Supabase 프로젝트가 활성화되어 있는지 확인하세요
- RLS 정책이 올바르게 설정되었는지 확인하세요

### 이미지 업로드 오류
- Storage 버킷이 생성되었는지 확인하세요
- Storage 정책이 올바르게 설정되었는지 확인하세요
- 파일 크기 제한을 확인하세요

## 📝 추가 참고 자료

- [Vite 환경 변수 가이드](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase 문서](https://supabase.com/docs)
- [Vercel 배포 가이드](https://vercel.com/docs)
- [Netlify 배포 가이드](https://docs.netlify.com/)
