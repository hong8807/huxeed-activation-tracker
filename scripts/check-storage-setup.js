/**
 * Supabase Storage 버킷 설정 확인 스크립트
 *
 * 실행 방법:
 * node scripts/check-storage-setup.js
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

async function checkStorageSetup() {
  console.log('🔍 Supabase Storage 설정 확인 중...\n')

  // 1. 버킷 목록 조회
  console.log('📦 버킷 목록 조회...')
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

  if (bucketsError) {
    console.error('❌ 버킷 조회 실패:', bucketsError.message)
    return
  }

  console.log(`✅ 총 ${buckets.length}개 버킷 발견:\n`)
  buckets.forEach(bucket => {
    const isTarget = bucket.name === 'supplier-documents'
    console.log(isTarget ? '🎯' : '  ', bucket.name, isTarget ? '(TARGET)' : '')
    console.log('     - Public:', bucket.public ? 'YES' : 'NO')
    console.log('     - File Size Limit:', bucket.file_size_limit ? `${bucket.file_size_limit / 1024 / 1024}MB` : 'None')
  })

  // 2. supplier-documents 버킷 확인
  const supplierDocsBucket = buckets.find(b => b.name === 'supplier-documents')

  if (!supplierDocsBucket) {
    console.log('\n❌ supplier-documents 버킷이 없습니다!')
    console.log('\n📝 다음 중 하나를 실행하세요:')
    console.log('   1. Supabase Dashboard에서 수동으로 버킷 생성')
    console.log('   2. node scripts/create-storage-bucket.js 실행')
    console.log('\n자세한 내용은 SETUP_STORAGE.md를 참조하세요.')
    return
  }

  console.log('\n✅ supplier-documents 버킷 발견!')
  console.log('   - ID:', supplierDocsBucket.id)
  console.log('   - Public:', supplierDocsBucket.public ? 'YES ⚠️ (보안 경고!)' : 'NO ✅')
  console.log('   - File Size Limit:', supplierDocsBucket.file_size_limit ? `${supplierDocsBucket.file_size_limit / 1024 / 1024}MB` : 'None')

  // 3. 버킷 내부 파일 목록 조회
  console.log('\n📂 버킷 내부 파일 목록 조회...')
  const { data: files, error: filesError } = await supabase.storage
    .from('supplier-documents')
    .list('', {
      limit: 100,
      offset: 0
    })

  if (filesError) {
    console.error('❌ 파일 목록 조회 실패:', filesError.message)
    return
  }

  if (files.length === 0) {
    console.log('📭 버킷이 비어있습니다 (아직 파일이 업로드되지 않음)')
  } else {
    console.log(`✅ ${files.length}개 폴더/파일 발견:\n`)
    files.forEach(file => {
      console.log('  📁', file.name, `(${file.metadata ? 'File' : 'Folder'})`)
    })
  }

  // 4. supplier_documents 테이블 확인
  console.log('\n🗃️  supplier_documents 테이블 확인...')
  const { data: documents, error: dbError } = await supabase
    .from('supplier_documents')
    .select('*', { count: 'exact', head: true })

  if (dbError) {
    console.error('❌ 테이블 조회 실패:', dbError.message)
    console.log('   마이그레이션을 실행하셨나요?')
    console.log('   supabase/migrations/20250107_create_supplier_documents_table.sql')
    return
  }

  const { count } = await supabase
    .from('supplier_documents')
    .select('*', { count: 'exact', head: true })

  console.log(`✅ supplier_documents 테이블 존재`)
  console.log(`   - 저장된 파일 메타데이터: ${count}개`)

  // 5. RLS 정책 확인 (간접적으로)
  console.log('\n🔒 RLS 정책 확인...')
  try {
    // Service Role Key로는 RLS를 우회하므로, 익명 클라이언트로 테스트
    const anonClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await anonClient
      .from('supplier_documents')
      .select('*')
      .limit(1)

    if (error && error.message.includes('RLS')) {
      console.log('✅ RLS 정책이 활성화되어 있습니다 (보안 강화)')
    } else if (!error) {
      console.log('⚠️  RLS 정책이 없거나 public 접근 가능')
    }
  } catch (e) {
    console.log('⚠️  RLS 정책 확인 실패 (익명 접근 불가)')
  }

  // 최종 요약
  console.log('\n' + '='.repeat(60))
  console.log('📊 설정 요약')
  console.log('='.repeat(60))
  console.log('✅ supplier-documents 버킷:', supplierDocsBucket ? 'OK' : 'MISSING')
  console.log('✅ supplier_documents 테이블:', 'OK')
  console.log('✅ 업로드된 파일 개수:', count)
  console.log('='.repeat(60))

  if (supplierDocsBucket && count === 0) {
    console.log('\n💡 파일 업로드 테스트를 진행하세요:')
    console.log('   1. npm run dev')
    console.log('   2. http://localhost:3000/pipeline/sourcing')
    console.log('   3. 제조원 추가 시 파일 업로드')
    console.log('   4. http://localhost:3000/pipeline/documents 에서 확인')
  }
}

checkStorageSetup()
  .then(() => console.log('\n✅ 확인 완료!'))
  .catch(error => {
    console.error('\n❌ 오류 발생:', error)
    process.exit(1)
  })
