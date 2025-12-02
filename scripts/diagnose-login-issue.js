/**
 * 로그인 문제 진단 스크립트
 *
 * 확인 사항:
 * 1. users 테이블 RLS 정책
 * 2. meeting_comments 테이블 RLS 정책
 * 3. email_subscribers 테이블 RLS 정책
 * 4. 로그인 API 동작 테스트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  console.log('🔍 로그인 문제 진단 시작...\n');

  // ========================================
  // Test 1: Service Role Key로 users 테이블 조회
  // ========================================
  console.log('📊 Test 1: Service Role Key로 users 테이블 조회');
  const { data: usersService, error: usersServiceError } = await serviceClient
    .from('users')
    .select('email, role, is_active')
    .limit(3);

  if (usersServiceError) {
    console.log('   ❌ 실패:', usersServiceError.message);
    console.log('   → users 테이블 RLS 정책에 문제가 있을 수 있습니다\n');
  } else {
    console.log('   ✅ 성공: users 테이블 조회 가능');
    console.log('   → 계정 목록:', usersService.map(u => `${u.email} (${u.role})`).join(', '));
    console.log();
  }

  // ========================================
  // Test 2: Anon Key로 users 테이블 조회 (실패해야 정상)
  // ========================================
  console.log('📊 Test 2: Anon Key로 users 테이블 조회 (실패해야 정상)');
  const { data: usersAnon, error: usersAnonError } = await anonClient
    .from('users')
    .select('email, role')
    .limit(1);

  if (usersAnonError) {
    console.log('   ✅ 정상: Anon Key로는 users 조회 불가');
    console.log('   → RLS 정책이 정상 작동 중\n');
  } else {
    console.log('   ❌ 경고: Anon Key로도 users 조회 가능');
    console.log('   → users 테이블 RLS 정책이 너무 느슨함\n');
  }

  // ========================================
  // Test 3: meeting_comments 테이블 RLS 확인
  // ========================================
  console.log('📊 Test 3: meeting_comments 테이블 조회 (Anon Key)');
  const { data: comments, error: commentsError } = await anonClient
    .from('meeting_comments')
    .select('*')
    .limit(1);

  if (commentsError) {
    console.log('   ❌ 실패:', commentsError.message);
    console.log('   → meeting_comments RLS 정책 확인 필요\n');
  } else {
    console.log('   ✅ 성공: meeting_comments 조회 가능');
    console.log('   → 댓글 기능 정상 작동 예상\n');
  }

  // ========================================
  // Test 4: email_subscribers 테이블 확인
  // ========================================
  console.log('📊 Test 4: email_subscribers 테이블 조회 (Service Role)');
  const { data: subscribers, error: subscribersError } = await serviceClient
    .from('email_subscribers')
    .select('name, is_active, permissions')
    .eq('is_active', true)
    .limit(3);

  if (subscribersError) {
    console.log('   ❌ 실패:', subscribersError.message);
  } else {
    console.log('   ✅ 성공: email_subscribers 조회 가능');
    console.log('   → 등록된 사용자:');
    subscribers.forEach(s => {
      console.log(`      - ${s.name}: permissions =`, s.permissions || 'null');
    });
    console.log();
  }

  // ========================================
  // 요약
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 진단 요약\n');

  if (!usersServiceError && usersAnonError && !commentsError) {
    console.log('✅ RLS 정책 정상: users는 보호됨, comments는 공개');
    console.log('   → 로그인 문제는 RLS가 아닌 다른 원인일 가능성 높음\n');
    console.log('💡 해결 방법:');
    console.log('   1. 브라우저에서 로그아웃');
    console.log('   2. 쿠키 삭제 (개발자 도구 → Application → Cookies)');
    console.log('   3. 재로그인');
    console.log('   4. 이름 입력 (공용 계정인 경우)');
  } else {
    console.log('⚠️ RLS 정책 문제 발견');
    console.log('   → scripts/fix-rls-for-comments.sql 실행 권장\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
})();
