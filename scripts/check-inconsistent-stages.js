/**
 * 제조원 정보 없이 MARKET_RESEARCH 이후 단계에 있는 카드 확인 스크립트
 *
 * 실행 방법:
 * node scripts/check-inconsistent-stages.js
 */

const { createClient } = require('@supabase/supabase-js');
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

async function checkInconsistentStages() {
  console.log('🔍 제조원 정보 없이 MARKET_RESEARCH 이후 단계에 있는 카드 확인 중...\n');

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

    console.log(`📊 총 ${targets.length}개 카드가 MARKET_RESEARCH 이후 단계에 있습니다.\n`);

    // 2. 모든 suppliers 조회
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('product_name');

    if (suppliersError) {
      console.error('❌ Suppliers 조회 실패:', suppliersError);
      process.exit(1);
    }

    // 3. 제조원이 있는 품목명 Set 생성 (정규화된 이름 사용)
    const supplierProductNames = new Set();
    if (suppliers && suppliers.length > 0) {
      suppliers.forEach(supplier => {
        const normalized = normalizeProductName(supplier.product_name);
        supplierProductNames.add(normalized);
      });
    }

    console.log(`📦 총 ${supplierProductNames.size}개 품목에 제조원 정보가 등록되어 있습니다.\n`);

    // 4. 제조원 정보가 없는 카드 찾기
    const inconsistentCards = targets.filter(target => {
      const normalized = normalizeProductName(target.product_name);
      return !supplierProductNames.has(normalized);
    });

    if (inconsistentCards.length === 0) {
      console.log('✅ 모든 카드가 제조원 정보를 가지고 있습니다. 데이터 일관성 문제 없음!');
      return;
    }

    console.log(`⚠️  ${inconsistentCards.length}개 카드가 제조원 정보 없이 MARKET_RESEARCH 이후 단계에 있습니다:\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    inconsistentCards.forEach((card, index) => {
      console.log(`\n${index + 1}. ${card.account_name} - ${card.product_name}`);
      console.log(`   ID: ${card.id}`);
      console.log(`   현재 단계: ${card.current_stage}`);
      console.log(`   담당자: ${card.owner_name || 'N/A'}`);
      console.log(`   등록일: ${new Date(card.created_at).toLocaleDateString('ko-KR')}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📋 요약:`);
    console.log(`   - MARKET_RESEARCH 이후 단계 카드: ${targets.length}개`);
    console.log(`   - 제조원 정보가 있는 카드: ${targets.length - inconsistentCards.length}개`);
    console.log(`   - 제조원 정보가 없는 카드: ${inconsistentCards.length}개`);
    console.log(`\n💡 다음 명령으로 이 카드들을 MARKET_RESEARCH 단계로 리셋할 수 있습니다:`);
    console.log(`   node scripts/reset-inconsistent-stages.js\n`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkInconsistentStages();
