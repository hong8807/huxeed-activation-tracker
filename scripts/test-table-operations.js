/**
 * Test Table CRUD 테스트
 * 실행: node scripts/test-table-operations.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTableOperations() {
  console.log('🧪 Test Table CRUD 작업 테스트 시작...\n');

  try {
    // 1. 전체 데이터 조회 (READ)
    console.log('📖 1. 전체 데이터 조회 (SELECT)');
    const { data: allData, error: readError } = await supabase
      .from('test_table')
      .select('*')
      .order('created_at', { ascending: true });

    if (readError) throw readError;

    console.log(`✅ 총 ${allData.length}개 레코드 조회됨`);
    console.table(allData.map(row => ({
      name: row.name,
      description: row.description,
      is_active: row.is_active ? '✅' : '❌',
      created_at: new Date(row.created_at).toLocaleString('ko-KR')
    })));

    // 2. 새 데이터 추가 (CREATE)
    console.log('\n➕ 2. 새 데이터 추가 (INSERT)');
    const { data: newData, error: createError } = await supabase
      .from('test_table')
      .insert([
        { name: '신규 테스트 1', description: 'Node.js에서 추가한 데이터' },
        { name: '신규 테스트 2', description: 'Supabase Client 테스트', is_active: false }
      ])
      .select();

    if (createError) throw createError;

    console.log(`✅ ${newData.length}개 레코드 추가됨`);
    console.table(newData.map(row => ({
      id: row.id.substring(0, 8) + '...',
      name: row.name,
      description: row.description
    })));

    // 3. 데이터 수정 (UPDATE)
    console.log('\n✏️  3. 데이터 수정 (UPDATE)');
    const targetId = newData[0].id;
    const { data: updatedData, error: updateError } = await supabase
      .from('test_table')
      .update({
        description: '수정된 설명입니다!',
        is_active: false
      })
      .eq('id', targetId)
      .select();

    if (updateError) throw updateError;

    console.log(`✅ 레코드 수정됨: ${updatedData[0].name}`);
    console.log(`   - 이전: "Node.js에서 추가한 데이터"`);
    console.log(`   - 이후: "${updatedData[0].description}"`);
    console.log(`   - is_active: ${updatedData[0].is_active}`);

    // 4. 조건부 조회 (WHERE)
    console.log('\n🔍 4. 조건부 조회 (WHERE is_active = false)');
    const { data: inactiveData, error: filterError } = await supabase
      .from('test_table')
      .select('*')
      .eq('is_active', false);

    if (filterError) throw filterError;

    console.log(`✅ 비활성 레코드 ${inactiveData.length}개 조회됨`);
    console.table(inactiveData.map(row => ({
      name: row.name,
      is_active: row.is_active ? '✅' : '❌'
    })));

    // 5. 데이터 삭제 (DELETE)
    console.log('\n🗑️  5. 데이터 삭제 (DELETE)');
    const { error: deleteError } = await supabase
      .from('test_table')
      .delete()
      .in('id', [newData[0].id, newData[1].id]);

    if (deleteError) throw deleteError;

    console.log(`✅ 2개 레코드 삭제됨`);

    // 6. 최종 확인
    console.log('\n📊 6. 최종 데이터 확인');
    const { data: finalData, error: finalError } = await supabase
      .from('test_table')
      .select('*')
      .order('created_at', { ascending: true });

    if (finalError) throw finalError;

    console.log(`✅ 최종 레코드 수: ${finalData.length}개`);
    console.table(finalData.map(row => ({
      name: row.name,
      description: row.description,
      is_active: row.is_active ? '✅' : '❌'
    })));

    console.log('\n🎉 모든 CRUD 작업 테스트 성공!');

  } catch (err) {
    console.error('❌ 오류 발생:', err.message);
  }
}

testTableOperations();
