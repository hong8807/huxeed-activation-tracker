const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Service Role Key 사용
);

(async () => {
  console.log('🔍 RLS 정책 확인 중...\n');

  // SQL 쿼리로 RLS 정책 조회
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        tablename,
        policyname,
        permissive,
        roles::text,
        cmd,
        qual::text as using_clause,
        with_check::text as with_check_clause
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('users', 'meeting_comments', 'meeting_items')
      ORDER BY tablename, policyname;
    `
  });

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 대안: Supabase Dashboard에서 직접 확인하세요');
    console.log('   → Settings → Database → RLS Policies\n');

    // 간단한 테스트: users 테이블 조회 가능 여부
    console.log('📊 간단한 테스트: users 테이블 조회 시도...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email, role')
      .limit(1);

    if (usersError) {
      console.log('❌ users 테이블 조회 실패:', usersError.message);
      console.log('   → RLS 정책에 문제가 있을 수 있습니다\n');
    } else {
      console.log('✅ users 테이블 조회 성공');
      console.log('   → Service Role Key로는 접근 가능\n');
    }

    return;
  }

  console.log('✅ RLS 정책 목록:\n');
  console.table(data);
})();
