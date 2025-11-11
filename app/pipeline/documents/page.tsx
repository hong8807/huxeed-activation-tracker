'use client'

import { useState, useEffect } from 'react'

interface DocumentFolder {
  product_name: string
  suppliers: {
    supplier_name: string
    document_count: number
    documents: Document[]
  }[]
}

interface Document {
  id: string
  supplier_id: string  // uuid
  product_name: string
  supplier_name: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_by: string
  description: string | null
  created_at: string
  updated_at: string
}

export default function DocumentsPage() {
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      console.log('📡 Documents API 호출 시작...')

      // 모든 문서 조회
      const response = await fetch('/api/download-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      console.log('📡 API 응답:', response.status, response.statusText)

      if (!response.ok) throw new Error('Failed to fetch documents')

      const data = await response.json()
      console.log('📦 받은 데이터:', data)

      const documents = data.documents || []
      console.log('📄 문서 개수:', documents.length)

      // 품목별 > 제조원별로 그룹화
      const folderMap = new Map<string, Map<string, Document[]>>()

      documents.forEach((doc: Document) => {
        if (!folderMap.has(doc.product_name)) {
          folderMap.set(doc.product_name, new Map())
        }

        const supplierMap = folderMap.get(doc.product_name)!
        if (!supplierMap.has(doc.supplier_name)) {
          supplierMap.set(doc.supplier_name, [])
        }

        supplierMap.get(doc.supplier_name)!.push(doc)
      })

      // Map을 배열로 변환
      const foldersArray: DocumentFolder[] = Array.from(folderMap.entries()).map(([product, supplierMap]) => ({
        product_name: product,
        suppliers: Array.from(supplierMap.entries()).map(([supplier, docs]) => ({
          supplier_name: supplier,
          document_count: docs.length,
          documents: docs
        }))
      }))

      console.log('📁 폴더 배열:', foldersArray)
      console.log('📁 폴더 개수:', foldersArray.length)

      setFolders(foldersArray)
    } catch (error) {
      console.error('Error fetching documents:', error)
      alert('문서 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/download-document?id=${documentId}`)

      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('파일 다운로드에 실패했습니다.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm2 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1z" />
        </svg>
      )
    }
    if (fileType.includes('image')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      )
    }
    if (fileType.includes('word')) {
      return (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 3h10a1 1 0 110 2H5a1 1 0 110-2zm0 3h10a1 1 0 110 2H5a1 1 0 110-2zm0 3h5a1 1 0 110 2H5a1 1 0 110-2z" />
        </svg>
      )
    }
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return (
        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v2H7V5zm0 4h6v2H7V9zm0 4h6v2H7v-2z" />
        </svg>
      )
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">제조원 서류 관리</h1>
          <p className="text-gray-600">품목별, 제조원별로 업로드된 서류를 관리하고 다운로드할 수 있습니다.</p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">업로드된 서류가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">제조원 관리 페이지에서 서류를 업로드해주세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Folder List */}
            {folders.map((folder) => (
              <div key={folder.product_name} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Product Folder */}
                <button
                  onClick={() => setExpandedProduct(expandedProduct === folder.product_name ? null : folder.product_name)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">{folder.product_name}</h3>
                      <p className="text-sm text-gray-500">{folder.suppliers.length}개 제조원</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedProduct === folder.product_name ? 'transform rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Supplier Folders */}
                {expandedProduct === folder.product_name && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {folder.suppliers.map((supplier) => (
                      <div key={supplier.supplier_name} className="border-b border-gray-100 last:border-0">
                        <button
                          onClick={() => setExpandedSupplier(expandedSupplier === supplier.supplier_name ? null : supplier.supplier_name)}
                          className="w-full px-8 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                            <div className="text-left">
                              <h4 className="font-medium text-gray-900">{supplier.supplier_name}</h4>
                              <p className="text-xs text-gray-500">{supplier.document_count}개 파일</p>
                            </div>
                          </div>
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                              expandedSupplier === supplier.supplier_name ? 'transform rotate-90' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        {/* Document List */}
                        {expandedSupplier === supplier.supplier_name && (
                          <div className="px-10 pb-4 space-y-2">
                            {supplier.documents.map((doc) => (
                              <div
                                key={doc.id}
                                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start gap-4">
                                  {/* File Icon */}
                                  <div className="flex-shrink-0">
                                    {getFileIcon(doc.file_type)}
                                  </div>

                                  {/* File Info */}
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-gray-900 truncate">{doc.file_name}</h5>
                                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                                      <span>{formatFileSize(doc.file_size)}</span>
                                      <span>•</span>
                                      <span>업로드: {doc.uploaded_by}</span>
                                      <span>•</span>
                                      <span>{formatDate(doc.created_at)}</span>
                                    </div>
                                    {doc.description && (
                                      <p className="mt-2 text-sm text-gray-600">{doc.description}</p>
                                    )}
                                  </div>

                                  {/* Download Button */}
                                  <button
                                    onClick={() => handleDownload(doc.id, doc.file_name)}
                                    className="flex-shrink-0 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    다운로드
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
