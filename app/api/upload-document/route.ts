import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()  // Service Role Key 사용 (RLS 우회)

    // FormData에서 파일 및 메타데이터 추출
    const formData = await request.formData()
    const file = formData.get('file') as File
    const supplierId = formData.get('supplier_id') as string
    const productName = formData.get('product_name') as string
    const supplierName = formData.get('supplier_name') as string
    const uploadedBy = formData.get('uploaded_by') as string
    const description = formData.get('description') as string | null

    // 필수 필드 검증
    if (!file || !supplierId || !productName || !supplierName || !uploadedBy) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 50MB를 초과할 수 없습니다' },
        { status: 400 }
      )
    }

    // 파일 확장자 검증 (보안)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'  // 테스트용
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다' },
        { status: 400 }
      )
    }

    // 폴더 구조 경로 생성: product_name/supplier_name/filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    // Supabase Storage는 영문, 숫자, 언더스코어, 하이픈만 허용 (한글 제거)
    const sanitizedProductName = productName.replace(/[^a-zA-Z0-9_-]/g, '_')
    const sanitizedSupplierName = supplierName.replace(/[^a-zA-Z0-9_-]/g, '_')
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')  // 파일명도 sanitize
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`
    const filePath = `${sanitizedProductName}/${sanitizedSupplierName}/${uniqueFileName}`

    // Supabase Storage에 파일 업로드
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('supplier-documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다: ' + uploadError.message },
        { status: 500 }
      )
    }

    // supplier_documents 테이블에 메타데이터 저장
    const { data: documentData, error: dbError } = await supabase
      .from('supplier_documents')
      .insert({
        supplier_id: supplierId,  // uuid 그대로 사용
        product_name: productName,
        supplier_name: supplierName,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: uploadedBy,
        description: description || null
      })
      .select()
      .single()

    if (dbError) {
      // 업로드된 파일 삭제 (롤백)
      await supabase.storage
        .from('supplier-documents')
        .remove([filePath])

      console.error('Database insert error:', dbError)
      return NextResponse.json(
        { error: '파일 정보 저장에 실패했습니다: ' + dbError.message },
        { status: 500 }
      )
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      document: documentData,
      message: '파일이 성공적으로 업로드되었습니다'
    })

  } catch (error) {
    console.error('Upload document error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
