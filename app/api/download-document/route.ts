import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    // URL에서 document ID 추출
    const searchParams = request.nextUrl.searchParams
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json(
        { error: '문서 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // supplier_documents 테이블에서 파일 정보 조회
    const { data: document, error: dbError } = await supabase
      .from('supplier_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (dbError || !document) {
      return NextResponse.json(
        { error: '문서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Supabase Storage에서 파일 다운로드
    const { data: fileData, error: storageError } = await supabase.storage
      .from('supplier-documents')
      .download(document.file_path)

    if (storageError || !fileData) {
      console.error('Storage download error:', storageError)
      return NextResponse.json(
        { error: '파일 다운로드에 실패했습니다' },
        { status: 500 }
      )
    }

    // Blob을 ArrayBuffer로 변환
    const buffer = await fileData.arrayBuffer()

    // 파일 다운로드 응답 생성
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': document.file_type,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(document.file_name)}"`,
        'Content-Length': document.file_size.toString()
      }
    })

  } catch (error) {
    console.error('Download document error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 파일 목록 조회 API (품목명 또는 제조원별)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    console.log('📡 [API] POST /api/download-document 호출됨')
    console.log('📦 [API] 요청 body:', body)

    const { product_name, supplier_name, supplier_id } = body

    let query = supabase
      .from('supplier_documents')
      .select('*')
      .order('created_at', { ascending: false })

    // 필터 적용
    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id)
    }
    if (product_name) {
      query = query.eq('product_name', product_name)
    }
    if (supplier_name) {
      query = query.eq('supplier_name', supplier_name)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('❌ [API] Query documents error:', error)
      return NextResponse.json(
        { error: '문서 목록 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    console.log('✅ [API] 조회된 문서 개수:', documents?.length || 0)
    console.log('📄 [API] 문서 목록:', documents)

    return NextResponse.json({
      success: true,
      documents: documents || []
    })

  } catch (error) {
    console.error('List documents error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
