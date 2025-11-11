/**
 * Supabase 테이블 데이터 초기화 스크립트
 * 모든 테이블의 데이터를 삭제합니다 (테이블 구조는 유지)
 *
 * 실행 방법:
 * node scripts/reset-all-data.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다!')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetAllData() {
  console.log('🔄 데이터 초기화 시작...\n')

  try {
    // 1. target_comments 테이블 초기화
    console.log('📝 1. target_comments 테이블 초기화...')
    const { error: commentsError, count: commentsCount } = await supabase
      .from('target_comments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 행 삭제

    if (commentsError && commentsError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ target_comments 삭제 실패:', commentsError.message)
    } else {
      console.log('✅ target_comments 초기화 완료')
    }

    // 2. supplier_documents 테이블 초기화
    console.log('📄 2. supplier_documents 테이블 초기화...')
    const { error: docsError } = await supabase
      .from('supplier_documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (docsError && docsError.code !== 'PGRST116') {
      console.error('❌ supplier_documents 삭제 실패:', docsError.message)
    } else {
      console.log('✅ supplier_documents 초기화 완료')
    }

    // 3. suppliers 테이블 초기화
    console.log('🏭 3. suppliers 테이블 초기화...')
    const { error: suppliersError } = await supabase
      .from('suppliers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (suppliersError && suppliersError.code !== 'PGRST116') {
      console.error('❌ suppliers 삭제 실패:', suppliersError.message)
    } else {
      console.log('✅ suppliers 초기화 완료')
    }

    // 4. stage_history 테이블 초기화
    console.log('📊 4. stage_history 테이블 초기화...')
    const { error: historyError } = await supabase
      .from('stage_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (historyError && historyError.code !== 'PGRST116') {
      console.error('❌ stage_history 삭제 실패:', historyError.message)
    } else {
      console.log('✅ stage_history 초기화 완료')
    }

    // 5. targets 테이블 초기화
    console.log('🎯 5. targets 테이블 초기화...')
    const { error: targetsError } = await supabase
      .from('targets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (targetsError && targetsError.code !== 'PGRST116') {
      console.error('❌ targets 삭제 실패:', targetsError.message)
    } else {
      console.log('✅ targets 초기화 완료')
    }

    // 6. Storage 파일 삭제
    console.log('🗂️  6. Storage 파일 초기화...')
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('supplier-documents')
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (listError) {
        console.error('❌ Storage 파일 목록 조회 실패:', listError.message)
      } else if (files && files.length > 0) {
        // 재귀적으로 모든 파일 찾기
        const allFiles = []

        async function listAllFiles(prefix = '') {
          const { data, error } = await supabase.storage
            .from('supplier-documents')
            .list(prefix, { limit: 1000 })

          if (error) {
            console.error(`❌ ${prefix} 파일 목록 조회 실패:`, error.message)
            return
          }

          for (const item of data) {
            const path = prefix ? `${prefix}/${item.name}` : item.name

            if (item.id === null) {
              // 폴더인 경우 재귀 호출
              await listAllFiles(path)
            } else {
              // 파일인 경우 목록에 추가
              allFiles.push(path)
            }
          }
        }

        await listAllFiles()

        if (allFiles.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from('supplier-documents')
            .remove(allFiles)

          if (deleteError) {
            console.error('❌ Storage 파일 삭제 실패:', deleteError.message)
          } else {
            console.log(`✅ Storage 파일 ${allFiles.length}개 삭제 완료`)
          }
        } else {
          console.log('✅ 삭제할 Storage 파일이 없습니다')
        }
      } else {
        console.log('✅ 삭제할 Storage 파일이 없습니다')
      }
    } catch (storageError) {
      console.error('❌ Storage 초기화 에러:', storageError.message)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ 모든 데이터 초기화 완료!')
    console.log('='.repeat(60))
    console.log('\n💡 이제 전체 기능을 처음부터 테스트할 수 있습니다:')
    console.log('   1. 로그인 → 접속자 이름 입력')
    console.log('   2. 엑셀 업로드 또는 시스템 내 품목 추가')
    console.log('   3. Pipeline 칸반보드에서 단계 이동')
    console.log('   4. 소싱요청 → 제조원 정보 입력 → 파일 업로드')
    console.log('   5. 제조원 정보 확인 및 Documents 페이지 확인')
    console.log('   6. 카드 클릭 → 댓글 작성')
    console.log('   7. Dashboard 및 Report 확인')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ 초기화 중 오류 발생:', error)
    process.exit(1)
  }
}

// 확인 프롬프트
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('⚠️  경고: 모든 테이블의 데이터가 삭제됩니다!')
console.log('⚠️  다음 테이블이 초기화됩니다:')
console.log('   - targets (품목)')
console.log('   - stage_history (단계 이력)')
console.log('   - suppliers (제조원)')
console.log('   - supplier_documents (서류)')
console.log('   - target_comments (댓글)')
console.log('   - Storage 파일 (supplier-documents)\n')

rl.question('정말 초기화하시겠습니까? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.close()
    resetAllData()
      .then(() => {
        console.log('\n✅ 완료!')
        process.exit(0)
      })
      .catch(error => {
        console.error('\n❌ 오류:', error)
        process.exit(1)
      })
  } else {
    console.log('\n❌ 초기화가 취소되었습니다.')
    rl.close()
    process.exit(0)
  }
})
