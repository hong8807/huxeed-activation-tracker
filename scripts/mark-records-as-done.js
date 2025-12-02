/**
 * 단순 기록(is_record=true) 항목 자동 완료 처리
 *
 * 목적: "기록" 항목은 실행이 필요 없으므로 자동으로 완료 처리하여
 *       실제 액션 아이템만 명확히 표시
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('📋 단순 기록 항목 자동 완료 처리 시작...\n');

  // Step 1: is_record=true이고 is_done=false인 항목 조회
  const { data: records, error: fetchError } = await supabase
    .from('meeting_items')
    .select('id, meeting_type, content, meeting_date, is_done, is_record')
    .eq('is_record', true)
    .eq('is_done', false)
    .order('meeting_date', { ascending: false });

  if (fetchError) {
    console.error('❌ 조회 실패:', fetchError.message);
    return;
  }

  if (!records || records.length === 0) {
    console.log('✅ 완료 처리가 필요한 기록 항목이 없습니다\n');
    return;
  }

  console.log(`📊 완료 처리할 기록 항목: ${records.length}개\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  records.forEach((item, index) => {
    console.log(`${index + 1}. [${item.meeting_type}] ${item.content.substring(0, 50)}...`);
    console.log(`   날짜: ${item.meeting_date}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 2: 자동으로 완료 처리 (확인 단계 생략)
  console.log(`✅ 자동으로 완료 처리를 진행합니다...\n`);

  // Step 3: 완료 처리
  const ids = records.map(r => r.id);
  const { data: updated, error: updateError } = await supabase
    .from('meeting_items')
    .update({ is_done: true })
    .in('id', ids)
    .select();

  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError.message);
    return;
  }

  console.log(`\n✅ ${updated.length}개 항목 완료 처리 완료!\n`);

  // Step 4: 결과 요약
  const { data: summary, error: summaryError } = await supabase
    .from('meeting_items')
    .select('is_done, is_record')
    .eq('is_record', true);

  if (!summaryError && summary) {
    const totalRecords = summary.length;
    const doneRecords = summary.filter(s => s.is_done).length;
    const pendingRecords = totalRecords - doneRecords;

    console.log('📊 전체 기록 항목 현황:');
    console.log(`   - 전체: ${totalRecords}개`);
    console.log(`   - 완료: ${doneRecords}개 ✅`);
    console.log(`   - 미완료: ${pendingRecords}개 ${pendingRecords > 0 ? '⚠️' : ''}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 앞으로 엑셀 업로드 시 자동으로 완료 처리하려면:');
  console.log('   /api/meetings/import API에서 is_record=true인 경우');
  console.log('   is_done=true로 저장하도록 수정하면 됩니다');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();
