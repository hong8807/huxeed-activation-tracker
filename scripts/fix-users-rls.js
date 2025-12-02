/**
 * users 테이블 RLS 정책 복구 스크립트
 *
 * 목적: users 테이블은 Service Role Key로만 접근 가능하도록 설정
 * 문제: 현재 Anon Key로도 조회 가능 (보안 취약)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔧 users 테이블 RLS 정책 복구 시작...\n');

  // SQL 파일 읽기
  const sqlPath = path.join(__dirname, 'fix-users-rls.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // SQL 실행 (rpc 대신 직접 SQL 실행)
  // Supabase JS Client는 직접 SQL 실행을 지원하지 않으므로
  // Supabase Dashboard에서 직접 실행해야 합니다

  console.log('❌ Supabase JS Client는 직접 SQL 실행을 지원하지 않습니다');
  console.log('   → Supabase Dashboard에서 직접 실행해주세요\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 실행할 SQL:\n');
  console.log(sql);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('💡 실행 방법:');
  console.log('   1. Supabase Dashboard 접속');
  console.log('   2. SQL Editor 메뉴 선택');
  console.log('   3. 위 SQL 복사하여 붙여넣기');
  console.log('   4. Run 버튼 클릭\n');

  console.log('또는 간단한 방법:');
  console.log('   npx supabase db reset --linked (전체 DB 리셋, 주의!)');
})();
