/**
 * Documents 페이지 API 직접 테스트
 */

const fetch = require('node-fetch')

async function testDocumentsAPI() {
  console.log('🧪 Documents API 테스트...\n')

  try {
    const response = await fetch('http://localhost:3000/api/download-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })

    console.log('📡 API 응답 상태:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API 에러:', errorText)
      return
    }

    const data = await response.json()
    console.log('✅ API 응답 성공!\n')
    console.log('📦 응답 데이터:')
    console.log(JSON.stringify(data, null, 2))

    if (data.documents && data.documents.length > 0) {
      console.log(`\n✅ ${data.documents.length}개 문서 발견`)
      console.log('\n📁 폴더 구조:')

      const folderMap = new Map()
      data.documents.forEach((doc) => {
        if (!folderMap.has(doc.product_name)) {
          folderMap.set(doc.product_name, new Map())
        }
        const supplierMap = folderMap.get(doc.product_name)
        if (!supplierMap.has(doc.supplier_name)) {
          supplierMap.set(doc.supplier_name, [])
        }
        supplierMap.get(doc.supplier_name).push(doc)
      })

      for (const [product, supplierMap] of folderMap.entries()) {
        console.log(`  📁 ${product}`)
        for (const [supplier, docs] of supplierMap.entries()) {
          console.log(`    📁 ${supplier} (${docs.length}개 파일)`)
          docs.forEach(doc => {
            console.log(`      📄 ${doc.file_name}`)
          })
        }
      }
    } else {
      console.log('⚠️  문서가 없습니다')
    }

  } catch (error) {
    console.error('❌ 네트워크 에러:', error.message)
    console.log('\n💡 개발 서버가 실행 중인지 확인하세요:')
    console.log('   npm run dev')
  }
}

testDocumentsAPI()
  .then(() => console.log('\n✅ 테스트 완료!'))
  .catch(error => {
    console.error('\n❌ 오류 발생:', error)
    process.exit(1)
  })
