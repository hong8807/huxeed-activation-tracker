/**
 * 제조원 정보 없이 MARKET_RESEARCH 이후 단계에 있는 카드를 MARKET_RESEARCH로 리셋하는 스크립트
 *
 * 실행 방법:
 * node scripts/reset-inconsistent-stages.js
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// .env.local 파일 읽기
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 품목명 정규화 함수
function normalizeProductName(productName) {
  if (!productName) return '';

  return productName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣-]/g, '');
}

// 사용자 확인 받기
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function resetInconsistentStages() {
  console.log('🔄 제조원 정보 없는 카드를 MARKET_RESEARCH로 리셋하는 중...\n');

  try {
    // 1. 모든 targets 조회 (MARKET_RESEARCH 제외)
    const { data: targets, error: targetsError } = await supabase
      .from('targets')
      .select('*')
      .neq('current_stage', 'MARKET_RESEARCH')
      .order('current_stage', { ascending: true });

    if (targetsError) {
      console.error('❌ Targets 조회 실패:', targetsError);
      process.exit(1);
    }

    if (!targets || targets.length === 0) {
      console.log('✅ MARKET_RESEARCH 이후 단계에 있는 카드가 없습니다.');
      return;
    }

    // 2. 모든 suppliers 조회
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('product_name');

    if (suppliersError) {
      console.error('❌ Suppliers 조회 실패:', suppliersError);
      process.exit(1);
    }

    // 3. 제조원이 있는 품목명 Set 생성
    const supplierProductNames = new Set();
    if (suppliers && suppliers.length > 0) {
      suppliers.forEach(supplier => {
        const normalized = normalizeProductName(supplier.product_name);
        supplierProductNames.add(normalized);
      });
    }

    // 4. 제조원 정보가 없는 카드 찾기
    const inconsistentCards = targets.filter(target => {
      const normalized = normalizeProductName(target.product_name);
      return !supplierProductNames.has(normalized);
    });

    if (inconsistentCards.length === 0) {
      console.log('✅ 모든 카드가 제조원 정보를 가지고 있습니다. 리셋할 카드가 없습니다.');
      return;
    }

    console.log(`⚠️  ${inconsistentCards.length}개 카드가 MARKET_RESEARCH로 리셋됩니다:\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    inconsistentCards.forEach((card, index) => {
      console.log(`\n${index + 1}. ${card.account_name} - ${card.product_name}`);
      console.log(`   현재 단계: ${card.current_stage} → MARKET_RESEARCH`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 5. 사용자 확인
    const confirmed = await askConfirmation('\n❓ 위 카드들을 MARKET_RESEARCH 단계로 리셋하시겠습니까? (y/n): ');

    if (!confirmed) {
      console.log('\n❌ 리셋이 취소되었습니다.');
      return;
    }

    console.log('\n🔄 리셋 시작...\n');

    // 6. 각 카드를 MARKET_RESEARCH로 업데이트
    let successCount = 0;
    let failCount = 0;

    for (const card of inconsistentCards) {
      try {
        // targets 테이블 업데이트
        const { error: updateError } = await supabase
          .from('targets')
          .update({
            current_stage: 'MARKET_RESEARCH',
            stage_updated_at: new Date().toISOString(),
            stage_progress_rate: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', card.id);

        if (updateError) {
          console.error(`   ❌ ${card.account_name} - ${card.product_name}: ${updateError.message}`);
          failCount++;
          continue;
        }

        // stage_history에 기록
        const { error: historyError } = await supabase
          .from('stage_history')
          .insert({
            target_id: card.id,
            stage: 'MARKET_RESEARCH',
            changed_at: new Date().toISOString(),
            actor_name: 'System',
            comment: `제조원 정보 없이 ${card.current_stage} 단계에 있어 자동으로 MARKET_RESEARCH로 리셋됨`
          });

        if (historyError) {
          console.warn(`   ⚠️  ${card.account_name} - ${card.product_name}: 단계 이력 기록 실패`);
        }

        console.log(`   ✅ ${card.account_name} - ${card.product_name}`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ ${card.account_name} - ${card.product_name}: ${error.message}`);
        failCount++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 리셋 완료:`);
    console.log(`   - 성공: ${successCount}개`);
    console.log(`   - 실패: ${failCount}개`);
    console.log(`   - 총: ${inconsistentCards.length}개\n`);

    if (successCount > 0) {
      console.log('✅ 데이터 일관성이 복구되었습니다!');
      console.log('💡 개발 서버를 새로고침하여 변경사항을 확인하세요.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

resetInconsistentStages();
