/**
 * 일동제약 세파클러 카드 확인 스크립트
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkIldongCefaclor() {
  console.log('🔍 일동제약 세파클러 검색 중...\n')

  // Search for 일동 and cefaclor
  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .or('account_name.ilike.%일동%,product_name.ilike.%cefaclor%,product_name.ilike.%세파클러%')

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`📊 검색 결과: ${data.length}개`)

  data.forEach((target, index) => {
    console.log(`\n[${index + 1}] ${target.account_name} - ${target.product_name}`)
    console.log(`   ID: ${target.id}`)
    console.log(`   현재 단계: ${target.current_stage}`)
    console.log(`   진행률: ${target.stage_progress_rate}%`)
    console.log(`   담당자: ${target.owner_name}`)
    console.log(`   마지막 업데이트: ${target.stage_updated_at}`)
  })

  // Check if any is in WON stage
  const wonTargets = data.filter(t => t.current_stage === 'WON')
  if (wonTargets.length > 0) {
    console.log(`\n✅ WON 단계 품목: ${wonTargets.length}개`)
    wonTargets.forEach(t => {
      console.log(`   - ${t.account_name} - ${t.product_name}`)
    })
  } else {
    console.log('\n⚠️  WON 단계 품목 없음')
  }
}

checkIldongCefaclor()
