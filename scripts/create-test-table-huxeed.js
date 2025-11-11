/**
 * Huxeed 프로젝트 Supabase 테스트 테이블 생성
 * 실행: node scripts/create-test-table-huxeed.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestTable() {
  console.log('🚀 Huxeed 프로젝트 테스트 테이블 생성 시작...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  const createTableSQL = `
CREATE TABLE IF NOT EXISTS test_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
  `.trim();

  const createIndexesSQL = `
CREATE INDEX IF NOT EXISTS idx_test_table_name ON test_table(name);
CREATE INDEX IF NOT EXISTS idx_test_table_created_at ON test_table(created_at DESC);
  `.trim();

  const insertDataSQL = `
INSERT INTO test_table (name, description) VALUES
  ('테스트 항목 1', 'MCP Supabase 연동 테스트'),
  ('테스트 항목 2', 'SQL 실행 테스트'),
  ('테스트 항목 3', '데이터베이스 작동 확인');
  `.trim();

  try {
    // 1. 테이블 생성
    console.log('📝 Step 1: 테이블 생성...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: createTableSQL
    });

    if (createError) {
      console.log('⚠️  RPC 함수가 없습니다. SQL Editor로 직접 실행해야 합니다.');
      console.log('\n📋 다음 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요:\n');
      console.log(createTableSQL);
      console.log('\n' + createIndexesSQL);
      console.log('\n' + insertDataSQL);
      return;
    }

    // 2. 인덱스 생성
    console.log('📝 Step 2: 인덱스 생성...');
    await supabase.rpc('exec_sql', { query: createIndexesSQL });

    // 3. 샘플 데이터 삽입
    console.log('📝 Step 3: 샘플 데이터 삽입...');
    const { data: insertedData, error: insertError } = await supabase
      .from('test_table')
      .insert([
        { name: '테스트 항목 1', description: 'MCP Supabase 연동 테스트' },
        { name: '테스트 항목 2', description: 'SQL 실행 테스트' },
        { name: '테스트 항목 3', description: '데이터베이스 작동 확인' }
      ])
      .select();

    if (insertError) {
      console.error('❌ 데이터 삽입 실패:', insertError.message);
      return;
    }

    console.log('✅ 테스트 테이블 생성 완료!\n');

    // 4. 데이터 조회 확인
    const { data: testData, error: selectError } = await supabase
      .from('test_table')
      .select('*')
      .order('created_at', { ascending: true });

    if (selectError) {
      console.error('❌ 데이터 조회 실패:', selectError.message);
      return;
    }

    console.log('📊 삽입된 데이터:');
    console.table(testData);

    console.log('\n🎯 테스트 테이블 정보:');
    console.log(`- 테이블명: test_table`);
    console.log(`- 총 레코드: ${testData.length}개`);
    console.log(`- 컬럼: id, name, description, is_active, created_at, updated_at`);
    console.log(`- 인덱스: name, created_at`);

  } catch (err) {
    console.error('❌ 오류 발생:', err.message);
  }
}

createTestTable();
