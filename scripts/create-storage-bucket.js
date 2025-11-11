/**
 * Supabase Storage 버킷 자동 생성 스크립트
 *
 * 실행 방법:
 * node scripts/create-storage-bucket.js
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

async function createStorageBucket() {
  console.log('🚀 supplier-documents 버킷 생성 시작...\n')

  // 1. 기존 버킷 확인
  console.log('🔍 기존 버킷 확인...')
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('❌ 버킷 목록 조회 실패:', listError.message)
    process.exit(1)
  }

  const exists = buckets.find(b => b.name === 'supplier-documents' || b.id === 'supplier-documents')

  if (exists) {
    console.log('⚠️  supplier-documents 버킷이 이미 존재합니다!')
    console.log('   - ID:', exists.id)
    console.log('   - Name:', exists.name)
    console.log('   - Public:', exists.public ? 'YES ⚠️' : 'NO ✅')
    console.log('   - File Size Limit:', exists.file_size_limit ? `${exists.file_size_limit / 1024 / 1024}MB` : 'None')
    console.log('\n✅ 설정 완료! 추가 작업이 필요 없습니다.')
    return
  }

  // 2. 새 버킷 생성
  console.log('📦 새 버킷 생성 중...')

  const { data, error } = await supabase.storage.createBucket('supplier-documents', {
    public: false,  // 비공개 (중요!)
    fileSizeLimit: 52428800,  // 50MB in bytes
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]
  })

  if (error) {
    console.error('❌ 버킷 생성 실패:', error.message)
    console.log('\n📝 수동 생성 방법:')
    console.log('   1. Supabase Dashboard > Storage')
    console.log('   2. Create a new bucket')
    console.log('   3. Name: supplier-documents')
    console.log('   4. Public: OFF')
    console.log('   5. File Size Limit: 50MB')
    process.exit(1)
  }

  console.log('✅ 버킷 생성 성공!')
  console.log('   - Name:', data.name)

  // 3. 버킷 설정 확인
  console.log('\n🔍 생성된 버킷 확인...')
  const { data: updatedBuckets } = await supabase.storage.listBuckets()
  const newBucket = updatedBuckets.find(b => b.name === 'supplier-documents')

  if (newBucket) {
    console.log('✅ 버킷 설정:')
    console.log('   - ID:', newBucket.id)
    console.log('   - Public:', newBucket.public ? 'YES ⚠️' : 'NO ✅')
    console.log('   - File Size Limit:', newBucket.file_size_limit ? `${newBucket.file_size_limit / 1024 / 1024}MB` : 'None')
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 설정 완료!')
  console.log('='.repeat(60))
  console.log('✅ supplier-documents 버킷이 생성되었습니다.')
  console.log('✅ 파일 업로드가 가능합니다.')
  console.log('\n💡 다음 단계:')
  console.log('   1. npm run dev')
  console.log('   2. http://localhost:3000/pipeline/sourcing')
  console.log('   3. 제조원 추가 시 파일 업로드 테스트')
  console.log('   4. http://localhost:3000/pipeline/documents 에서 확인')
  console.log('='.repeat(60))
}

createStorageBucket()
  .then(() => console.log('\n✅ 완료!'))
  .catch(error => {
    console.error('\n❌ 오류 발생:', error)
    process.exit(1)
  })
