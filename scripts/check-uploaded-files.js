/**
 * 업로드된 파일 상세 정보 확인 스크립트
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUploadedFiles() {
  console.log('📋 업로드된 파일 상세 정보 확인...\n')

  // 1. supplier_documents 테이블에서 모든 파일 정보 조회
  const { data: documents, error } = await supabase
    .from('supplier_documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ 파일 정보 조회 실패:', error.message)
    return
  }

  if (documents.length === 0) {
    console.log('📭 업로드된 파일이 없습니다.')
    return
  }

  console.log(`✅ 총 ${documents.length}개 파일 발견:\n`)

  // 품목별 그룹화
  const productMap = new Map()
  documents.forEach(doc => {
    if (!productMap.has(doc.product_name)) {
      productMap.set(doc.product_name, new Map())
    }
    const supplierMap = productMap.get(doc.product_name)
    if (!supplierMap.has(doc.supplier_name)) {
      supplierMap.set(doc.supplier_name, [])
    }
    supplierMap.get(doc.supplier_name).push(doc)
  })

  // 폴더 구조로 출력
  for (const [productName, supplierMap] of productMap.entries()) {
    console.log(`📁 ${productName}`)
    for (const [supplierName, docs] of supplierMap.entries()) {
      console.log(`  📁 ${supplierName} (${docs.length}개 파일)`)
      docs.forEach(doc => {
        console.log(`    📄 ${doc.file_name}`)
        console.log(`       - ID: ${doc.id}`)
        console.log(`       - Supplier ID: ${doc.supplier_id}`)
        console.log(`       - 파일 크기: ${(doc.file_size / 1024).toFixed(1)} KB`)
        console.log(`       - 파일 타입: ${doc.file_type}`)
        console.log(`       - 업로드자: ${doc.uploaded_by}`)
        console.log(`       - Storage 경로: ${doc.file_path}`)
        console.log(`       - 업로드 시각: ${new Date(doc.created_at).toLocaleString('ko-KR')}`)
        if (doc.description) {
          console.log(`       - 설명: ${doc.description}`)
        }
        console.log()
      })
    }
  }

  // 2. Storage에서 실제 파일 존재 확인
  console.log('🔍 Storage에서 실제 파일 존재 여부 확인...\n')

  for (const doc of documents) {
    const { data, error } = await supabase.storage
      .from('supplier-documents')
      .list(doc.file_path.split('/').slice(0, -1).join('/'), {
        limit: 100,
        search: doc.file_path.split('/').pop()
      })

    if (error) {
      console.log(`❌ ${doc.file_name}: Storage 조회 실패 (${error.message})`)
    } else if (!data || data.length === 0) {
      console.log(`⚠️  ${doc.file_name}: Storage에 파일 없음 (DB만 존재)`)
    } else {
      console.log(`✅ ${doc.file_name}: Storage에 파일 존재`)
    }
  }

  // 3. Documents 페이지 API 테스트
  console.log('\n🧪 Documents 페이지 API 테스트...\n')

  // 모든 문서 조회 (POST 요청)
  const { data: allDocs, error: apiError } = await supabase
    .from('supplier_documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (apiError) {
    console.error('❌ API 조회 실패:', apiError.message)
  } else {
    console.log(`✅ API 응답: ${allDocs.length}개 문서`)

    // 폴더 구조 생성 테스트
    const folderMap = new Map()
    allDocs.forEach((doc) => {
      if (!folderMap.has(doc.product_name)) {
        folderMap.set(doc.product_name, new Map())
      }
      const supplierMap = folderMap.get(doc.product_name)
      if (!supplierMap.has(doc.supplier_name)) {
        supplierMap.set(doc.supplier_name, [])
      }
      supplierMap.get(doc.supplier_name).push(doc)
    })

    console.log('\n📊 Documents 페이지 구조:')
    for (const [product, supplierMap] of folderMap.entries()) {
      console.log(`  📁 ${product} (${supplierMap.size}개 제조원)`)
      for (const [supplier, docs] of supplierMap.entries()) {
        console.log(`    📁 ${supplier} (${docs.length}개 파일)`)
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('💡 Documents 페이지 확인:')
  console.log('   http://localhost:3000/pipeline/documents')
  console.log('='.repeat(60))
}

checkUploadedFiles()
  .then(() => console.log('\n✅ 확인 완료!'))
  .catch(error => {
    console.error('\n❌ 오류 발생:', error)
    process.exit(1)
  })
