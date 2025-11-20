# ⚡ 성능 최적화 가이드

## 🐌 로컬 vs Vercel 속도 차이 원인

### 환경별 특성

| 구분 | 로컬 (npm run dev) | Vercel (프로덕션) |
|------|-------------------|------------------|
| 번들링 | Turbopack (초고속) | Webpack (최적화) |
| 최적화 | ❌ 비활성화 | ✅ 전체 활성화 |
| 네트워크 | localhost (0ms) | 한국→미국 (50-200ms) |
| 캐싱 | 메모리 캐시 | CDN + ISR 캐시 |
| 서버 | 로컬 프로세스 | 서버리스 함수 (Cold Start) |

### 주요 속도 차이 원인

1. **네트워크 지연** (가장 큰 원인)
   - 로컬: `localhost` → 0ms
   - Vercel: 한국 → Vercel (미국/아시아) → 50-200ms

2. **서버리스 Cold Start**
   - 첫 요청: 1-3초 (함수 초기화)
   - 이후 요청: 빠름 (Warm)
   - 5분 이상 요청 없으면 다시 Cold Start

3. **Supabase API 호출**
   - 로컬: PC → Supabase (직접)
   - Vercel: PC → Vercel → Supabase (2홉)

4. **빌드 최적화**
   - 로컬: 최적화 안 함 (개발 모드)
   - Vercel: 전체 최적화 (minify, compress, tree-shaking)

---

## 🚀 적용된 성능 최적화

### 1. Next.js 설정 최적화 (`next.config.ts`)

#### 기본 최적화
```typescript
// React Strict Mode (디버깅)
reactStrictMode: true

// 압축 활성화 (gzip, brotli)
compress: true

// 프로덕션 소스맵 비활성화 (빌드 속도 향상)
productionBrowserSourceMaps: false

// SWC Minify (Terser보다 20배 빠름)
swcMinify: true
```

#### 이미지 최적화
```typescript
images: {
  domains: ['eikqjezcngsxskjpleyq.supabase.co'],
  formats: ['image/avif', 'image/webp'],  // 최신 포맷 우선
}
```

#### 패키지 최적화
```typescript
experimental: {
  optimizePackageImports: [
    '@supabase/supabase-js',  // Supabase 클라이언트
    'exceljs',                // 엑셀 처리
    'nodemailer'              // 이메일 발송
  ],
}
```

### 2. 페이지 캐싱 (ISR)

#### Dashboard 페이지
```typescript
// 30초마다 재검증 (Incremental Static Regeneration)
export const revalidate = 30
```

**효과**:
- 첫 방문: 서버에서 렌더링 (느림)
- 30초 이내 재방문: 캐시된 HTML 반환 (초고속)
- 30초 후: 백그라운드 재생성

### 3. HTTP 헤더 최적화

#### DNS Prefetch
```typescript
'X-DNS-Prefetch-Control': 'on'
```
- Supabase API 호출 전 DNS 미리 조회

#### 정적 파일 캐싱
```typescript
source: '/static/:path*'
Cache-Control: 'public, max-age=31536000, immutable'
```
- CSS, JS, 이미지 1년간 브라우저 캐시

---

## 📊 성능 측정 결과

### 개선 전후 비교 (예상)

| 지표 | 개선 전 | 개선 후 | 개선율 |
|------|--------|--------|--------|
| 첫 페이지 로드 | 2-3초 | 1-1.5초 | **50%↓** |
| 재방문 로드 | 1-2초 | 0.3-0.5초 | **75%↓** |
| Dashboard API | 500ms | 100ms (캐시) | **80%↓** |
| 정적 파일 | 200ms | 50ms (캐시) | **75%↓** |

### Vercel Analytics 확인

1. **Vercel 대시보드** 접속
   - https://vercel.com/hongs-projects-1ef6c17d/huxeed-activation-tracker

2. **Analytics 탭**
   - Real Experience Score (RES)
   - Core Web Vitals:
     - LCP (Largest Contentful Paint): <2.5초 목표
     - FID (First Input Delay): <100ms 목표
     - CLS (Cumulative Layout Shift): <0.1 목표

---

## 🔧 추가 최적화 방안

### 단기 (1-2시간)

#### 1. 동적 Import
```typescript
// 무거운 컴포넌트는 필요할 때만 로드
const ExcelUpload = dynamic(() => import('@/components/ExcelUpload'), {
  loading: () => <Spinner />,
  ssr: false  // 클라이언트에서만 로드
})
```

#### 2. React Server Components 활용
```typescript
// 서버 컴포넌트로 변경 (현재 대부분 적용됨)
// 'use client' 제거 가능한 컴포넌트 찾기
```

#### 3. Supabase 쿼리 최적화
```typescript
// 필요한 컬럼만 선택
.select('id, name, email')  // ❌ .select('*')

// 인덱스 활용
.order('created_at')  // created_at에 인덱스 필요

// 페이지네이션
.range(0, 49)  // 한 번에 50개만
```

### 중기 (1-2일)

#### 1. Vercel Edge Functions
```typescript
// API Routes를 Edge Runtime으로 마이그레이션
export const runtime = 'edge'
```
- Cold Start 거의 없음
- 전 세계 Edge 네트워크에서 실행
- 한국 사용자에게 더 빠름

#### 2. Redis 캐싱 (Vercel KV)
```typescript
// 자주 조회되는 데이터 캐싱
import { kv } from '@vercel/kv'

const targets = await kv.get('targets:all') ||
  await fetchTargetsFromSupabase()
```

#### 3. 이미지 최적화
```typescript
// Next.js Image 컴포넌트 사용
import Image from 'next/image'

<Image
  src="/logo.png"
  width={200}
  height={100}
  priority  // LCP 이미지는 priority
/>
```

### 장기 (1주 이상)

#### 1. Supabase Edge Functions
- Vercel과 가까운 리전에서 실행
- 네트워크 홉 감소

#### 2. CDN 최적화
- Vercel의 Global CDN 활용 (자동 적용됨)
- 정적 파일은 한국 CDN에서 서빙

#### 3. 번들 크기 분석
```bash
# 번들 분석
npm run build
npx @next/bundle-analyzer
```

---

## 🎯 현재 병목 지점

### 1. Supabase API 호출 (가장 큰 병목)

**문제**:
- 모든 페이지가 Supabase에서 데이터 조회
- 네트워크 왕복 시간 (RTT): 50-200ms

**해결책**:
- ✅ ISR 캐싱 활성화 (30초)
- 🔄 React Query 도입 (클라이언트 캐싱)
- 🔄 Vercel KV 캐싱 (서버 캐싱)

### 2. 서버리스 Cold Start

**문제**:
- 5분 이상 요청 없으면 함수 종료
- 다음 요청 시 1-3초 초기화

**해결책**:
- 🔄 Vercel Cron으로 주기적 Ping (Hobby 플랜은 불가)
- 🔄 Edge Runtime 사용 (Cold Start 거의 없음)

### 3. 큰 번들 크기

**문제**:
- ExcelJS, Nodemailer 등 무거운 라이브러리

**해결책**:
- ✅ 패키지 최적화 활성화
- 🔄 동적 import 적용
- 🔄 불필요한 라이브러리 제거

---

## 📈 성능 모니터링

### Vercel Analytics

1. **Real Experience Score**
   - 실제 사용자 경험 측정
   - Vercel 대시보드에서 확인

2. **Core Web Vitals**
   - LCP: 페이지 로딩 속도
   - FID: 반응성
   - CLS: 레이아웃 안정성

3. **함수 실행 시간**
   - 각 API Route 실행 시간
   - Cold Start vs Warm Start

### Chrome DevTools

1. **Network 탭**
   - 각 요청 응답 시간
   - Waterfall 차트

2. **Performance 탭**
   - FCP, LCP 측정
   - JavaScript 실행 시간

3. **Lighthouse**
   - 전체 성능 점수
   - 개선 제안

---

## 🚨 주의사항

### ISR 캐싱 사용 시

- 실시간 데이터가 중요한 페이지는 `revalidate` 짧게 설정
- 또는 클라이언트 사이드 데이터 페칭 사용

### Edge Runtime 제약

- Node.js API 사용 불가 (fs, path 등)
- 일부 라이브러리 호환 안 됨
- 실행 시간 제한: 25초 (Hobby 플랜)

### 캐싱 주의

- 캐시 무효화 전략 필요
- 사용자별 데이터는 캐시하면 안 됨
- 민감한 데이터 캐시 금지

---

## ✅ 적용 완료 사항

- ✅ `next.config.ts` 최적화 설정
- ✅ Dashboard ISR 캐싱 (30초)
- ✅ HTTP 헤더 최적화
- ✅ 이미지 최적화 설정
- ✅ 패키지 최적화 설정
- ✅ 압축 활성화

## 🔄 향후 적용 예정

- 🔄 동적 Import (무거운 컴포넌트)
- 🔄 React Query (클라이언트 캐싱)
- 🔄 Edge Runtime (API Routes)
- 🔄 Vercel KV (Redis 캐싱)
- 🔄 번들 크기 분석 및 최적화

---

**작성일**: 2025-01-11
**작성자**: Claude
**문서 버전**: 1.0
