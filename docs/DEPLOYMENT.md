# 배포 가이드

**버전**: v2.12
**최종 업데이트**: 2025-01-22

---

## 🚀 Vercel 배포

### CLI 배포 (권장)

```bash
# 1. Vercel CLI 설치 (최초 1회)
npm install -g vercel

# 2. Vercel 로그인
vercel login

# 3. 프로덕션 배포
vercel --prod
```

### Git 연동 자동 배포

1. GitHub 저장소 푸시
2. Vercel 대시보드에서 자동 배포

---

## 🔧 환경 변수 설정

Vercel 대시보드에서 설정:

**Project Settings > Environment Variables**

### 필수 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | https://xxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | eyJhbGciOiJ... |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | eyJhbGciOiJ... |
| `EMAIL_USER` | Gmail 주소 | user@gmail.com |
| `EMAIL_APP_PASSWORD` | Gmail 앱 비밀번호 | xxxx xxxx xxxx xxxx |

### 환경 설정

모든 환경 변수에 대해 다음 옵션 선택:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 📋 배포 체크리스트

### 배포 전

- [ ] 로컬에서 빌드 테스트 (`npm run build`)
- [ ] 타입 에러 확인 (`npm run type-check`)
- [ ] 린트 에러 확인 (`npm run lint`)
- [ ] 환경 변수 확인
- [ ] Git 커밋 완료

### 배포 중

```bash
# 상태 확인
vercel ls

# 로그 확인
vercel logs huxeed-activation-tracker-xxx.vercel.app
```

### 배포 후

- [ ] 프로덕션 URL 접속 확인
- [ ] 로그인 기능 테스트
- [ ] 주요 기능 테스트
- [ ] 이메일 발송 테스트

---

## 🔄 롤백

### 이전 배포로 롤백

```bash
# 배포 목록 확인
vercel ls

# 특정 배포로 롤백 (프로덕션 프로모트)
vercel promote huxeed-activation-tracker-abc123.vercel.app
```

### Vercel 대시보드에서 롤백

1. Project > Deployments
2. 이전 성공한 배포 선택
3. "..." 메뉴 > "Promote to Production"

---

## 📊 모니터링

### 배포 상태 확인

```bash
# 최근 배포 목록
vercel ls

# 특정 배포 상세 정보
vercel inspect huxeed-activation-tracker-xxx.vercel.app
```

### 로그 확인

```bash
# 실시간 로그
vercel logs huxeed-activation-tracker-xxx.vercel.app --follow
```

### Vercel 대시보드

- Analytics: 트래픽 분석
- Logs: 실시간 로그
- Functions: 서버리스 함수 모니터링

---

## ⚠️ 문제 해결

### 빌드 실패

1. 로컬에서 빌드 테스트
   ```bash
   npm run build
   ```

2. 에러 메시지 확인
   ```bash
   vercel logs huxeed-activation-tracker-xxx.vercel.app
   ```

### 환경 변수 오류

1. Vercel 대시보드에서 환경 변수 확인
2. 값에 공백/특수문자 확인
3. 재배포 필요

### 500 에러

1. Vercel 로그 확인
2. Supabase 연결 확인
3. API 엔드포인트 테스트

---

## 🔐 보안

### 민감한 정보 관리

- `.env.local` 파일은 Git에 커밋하지 않음
- Vercel 환경 변수로 관리
- service_role_key는 서버 사이드에서만 사용

### SSL/HTTPS

- Vercel 자동 SSL 인증서 제공
- 모든 트래픽 HTTPS 강제

---

## 📈 성능 최적화

### Next.js 설정

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  images: {
    domains: ['xxx.supabase.co'],
  },
}
```

### Vercel 설정

- Edge Functions 활용
- 이미지 최적화 활성화
- 캐싱 전략 설정

---

## 🌍 도메인 설정

### 커스텀 도메인 연결

1. Vercel 대시보드 > Project Settings > Domains
2. 도메인 추가
3. DNS 레코드 설정 (CNAME 또는 A 레코드)

### SSL 인증서

- Vercel 자동 발급 (Let's Encrypt)
- 수동 인증서 업로드 가능
