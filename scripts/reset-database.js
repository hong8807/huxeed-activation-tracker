/**
 * 데이터베이스 초기화 스크립트
 * 모든 테스트 데이터를 삭제합니다.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// .env.local 파일 읽기
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    envVars[key] = value
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetDatabase() {
  console.log('🔄 데이터베이스 초기화 시작...\n')

  try {
    // 1. targets 테이블 삭제 (CASCADE로 stage_history, suppliers도 함께 삭제됨)
    console.log('📊 targets 테이블 데이터 삭제 중...')
    const { data: targets, error: targetsError } = await supabase
      .from('targets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 레코드 삭제

    if (targetsError) {
      console.error('❌ targets 삭제 실패:', targetsError.message)
    } else {
      console.log('✅ targets 테이블 초기화 완료')
    }

    // 2. stage_history 확인 (CASCADE로 자동 삭제되어야 함)
    console.log('\n📝 stage_history 테이블 확인 중...')
    const { data: history, error: historyError } = await supabase
      .from('stage_history')
      .select('id')

    if (historyError) {
      console.error('❌ stage_history 조회 실패:', historyError.message)
    } else {
      console.log(`✅ stage_history: ${history?.length || 0}건 (CASCADE 삭제 확인)`)
    }

    // 3. suppliers 확인 (CASCADE로 자동 삭제되어야 함)
    console.log('\n🏭 suppliers 테이블 확인 중...')
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('id')

    if (suppliersError) {
      console.error('❌ suppliers 조회 실패:', suppliersError.message)
    } else {
      console.log(`✅ suppliers: ${suppliers?.length || 0}건 (CASCADE 삭제 확인)`)
    }

    console.log('\n✅ 데이터베이스 초기화 완료!')
    console.log('\n📋 테스트 준비 완료:')
    console.log('   1. 엑셀 템플릿 다운로드')
    console.log('   2. 데이터 입력')
    console.log('   3. 업로드 - 검증')
    console.log('   4. 업로드 - 저장')
    console.log('   5. 중복 업로드 테스트')

  } catch (error) {
    console.error('❌ 초기화 중 오류 발생:', error)
    process.exit(1)
  }
}

// 스크립트 실행
resetDatabase()
