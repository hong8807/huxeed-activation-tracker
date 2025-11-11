'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ImportError {
  row: number
  message: string
}

interface ImportResult {
  success: boolean
  imported: number
  updated: number
  created: number
  errors: ImportError[]
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ValidatedRow {
  row: number
  data: any
  isValid: boolean
  errors: string[]
}

interface ValidationResult {
  success: boolean
  totalRows: number
  validRows: number
  invalidRows: number
  rows: ValidatedRow[]
  errors: ValidationError[]
}

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validating, setValidating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/download-template')
      if (!response.ok) {
        alert('템플릿 다운로드에 실패했습니다')
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `HUXEED_Activation_Template_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading template:', error)
      alert('템플릿 다운로드 중 오류가 발생했습니다')
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      alert('엑셀 파일(.xlsx)만 업로드 가능합니다')
      return
    }
    setSelectedFile(file)
    setValidationResult(null)
    setImportResult(null)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }

  // Step 1: 검증하기
  const handleValidate = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요')
      return
    }

    setValidating(true)
    setValidationResult(null)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/validate-targets', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setValidationResult(data)
      } else {
        alert(`검증 실패: ${data.error || '알 수 없는 오류'}\n상세: ${data.details || ''}`)
      }
    } catch (error) {
      console.error('Validation error:', error)
      alert('검증 중 오류가 발생했습니다')
    } finally {
      setValidating(false)
    }
  }

  // Step 2: 확인 후 업로드
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요')
      return
    }

    if (!validationResult) {
      alert('먼저 검증을 진행해주세요')
      return
    }

    if (validationResult.validRows === 0) {
      alert('업로드할 유효한 행이 없습니다')
      return
    }

    setUploading(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/import-targets', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setImportResult(data)
        if (data.success) {
          // 성공 시 파일 초기화
          setSelectedFile(null)
          setValidationResult(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      } else {
        alert(`업로드 실패: ${data.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('업로드 중 오류가 발생했습니다')
    } finally {
      setUploading(false)
    }
  }

  const handleGoToPipeline = () => {
    router.push('/pipeline')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">엑셀 업로드로 품목 추가</h1>
              <p className="text-gray-600 mt-2">엑셀 파일을 업로드하여 여러 품목을 한번에 추가하거나 수정하세요</p>
            </div>
            <Link
              href="/pipeline"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              파이프라인으로
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* 템플릿 다운로드 버튼 */}
          <div>
            <button
              onClick={handleDownloadTemplate}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              엑셀 템플릿 다운로드
            </button>
          </div>

          {/* 파일 드롭 영역 */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                block w-full p-12 border-2 border-dashed rounded-lg cursor-pointer
                transition-colors text-center
                ${dragOver
                  ? 'border-blue-500 bg-blue-50'
                  : selectedFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }
              `}
            >
              <div className="flex flex-col items-center gap-3">
                <svg
                  className={`w-12 h-12 ${selectedFile ? 'text-green-500' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {selectedFile ? (
                  <div>
                    <p className="text-lg font-medium text-green-700">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      파일을 여기에 드롭하거나 클릭하여 선택
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Excel 파일(.xlsx)만 업로드 가능</p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* 안내 사항 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800 space-y-1">
                <p className="font-medium">✓ 엑셀 양식에 맞춰 데이터를 입력해주세요</p>
                <p>✓ 수식 필드(회색 배경)는 자동으로 계산됩니다</p>
                <p>✓ 기존에 등록된 품목(거래처+품목명 기준)은 자동으로 업데이트됩니다</p>
                <p>✓ 업로드된 품목은 시장조사 단계로 시작됩니다</p>
                <p className="font-medium text-orange-700">⚠ 먼저 검증을 진행한 후 업로드해주세요</p>
              </div>
            </div>
          </div>

          {/* 검증 버튼 (Step 1) */}
          <button
            onClick={handleValidate}
            disabled={!selectedFile || validating}
            className={`
              w-full px-6 py-3 rounded-lg font-medium transition-colors
              flex items-center justify-center gap-2
              ${!selectedFile || validating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
              }
            `}
          >
            {validating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                검증 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                1단계: 데이터 검증하기
              </>
            )}
          </button>

          {/* 검증 결과 표시 */}
          {validationResult && (
            <div className={`rounded-lg p-6 ${validationResult.success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <h3 className={`text-lg font-bold mb-4 ${validationResult.success ? 'text-green-800' : 'text-yellow-800'}`}>
                {validationResult.success ? '✓ 검증 완료 - 모든 데이터가 유효합니다' : '⚠ 검증 완료 - 일부 오류가 있습니다'}
              </h3>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded p-3 border border-gray-200">
                  <div className="text-sm text-gray-600">총 행</div>
                  <div className="text-2xl font-bold text-gray-900">{validationResult.totalRows}</div>
                </div>
                <div className="bg-white rounded p-3 border border-green-300">
                  <div className="text-sm text-green-600">정상</div>
                  <div className="text-2xl font-bold text-green-700">{validationResult.validRows}</div>
                </div>
                <div className="bg-white rounded p-3 border border-red-300">
                  <div className="text-sm text-red-600">오류</div>
                  <div className="text-2xl font-bold text-red-700">{validationResult.invalidRows}</div>
                </div>
                <div className="bg-white rounded p-3 border border-blue-300">
                  <div className="text-sm text-blue-600">에러 수</div>
                  <div className="text-2xl font-bold text-blue-700">{validationResult.errors.length}</div>
                </div>
              </div>

              {/* 검증 결과 테이블 */}
              <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">행</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">거래처</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">품목</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">수량(kg)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">담당자</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">상태</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">오류 메시지</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {validationResult.rows.map((row, index) => (
                        <tr key={index} className={row.isValid ? 'bg-white' : 'bg-red-50'}>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.row}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.data.account_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.data.product_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.data.est_qty_kg?.toLocaleString() || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.data.owner_name || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            {row.isValid ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ 정상
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ✗ 오류
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-red-700">
                            {row.errors.length > 0 ? row.errors.join(', ') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 에러 요약 */}
              {validationResult.errors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">오류 상세 ({validationResult.errors.length}건)</h4>
                  <div className="space-y-1 text-sm text-red-700 max-h-32 overflow-y-auto">
                    {validationResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="font-medium">{error.row}행 [{error.field}]:</span>
                        <span>{error.message}</span>
                      </div>
                    ))}
                    {validationResult.errors.length > 10 && (
                      <div className="text-xs text-red-600 mt-2">
                        외 {validationResult.errors.length - 10}개 오류...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 업로드 버튼 (Step 2) */}
          {validationResult && validationResult.validRows > 0 && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`
                w-full px-6 py-3 rounded-lg font-medium transition-colors
                flex items-center justify-center gap-2
                ${uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
                }
              `}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  업로드 중...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 16v-6m0 0l3 3m-3-3l-3 3" />
                  </svg>
                  2단계: 확인 후 데이터베이스에 저장 ({validationResult.validRows}건)
                </>
              )}
            </button>
          )}

          {/* 최종 결과 표시 */}
          {importResult && (
            <div className={`rounded-lg p-6 ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className={`text-lg font-bold mb-4 ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {importResult.success ? '✓ 업로드 완료' : '⚠ 업로드 실패'}
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-700">총 처리:</span>
                  <span className="text-gray-900 font-bold">{importResult.imported}건</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-700">신규 추가:</span>
                  <span className="text-green-700 font-bold">{importResult.created}건</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-700">업데이트:</span>
                  <span className="text-blue-700 font-bold">{importResult.updated}건</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-700">에러:</span>
                  <span className="text-red-700 font-bold">{importResult.errors.length}건</span>
                </div>
              </div>

              {/* 에러 상세 */}
              {importResult.errors.length > 0 && (
                <div className="mt-4 p-4 bg-white rounded border border-red-300">
                  <h4 className="font-medium text-red-800 mb-2">에러 상세:</h4>
                  <div className="space-y-1 text-sm text-red-700 max-h-48 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="font-medium">{error.row}행:</span>
                        <span>{error.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 파이프라인으로 이동 버튼 */}
              {importResult.success && importResult.imported > 0 && (
                <button
                  onClick={handleGoToPipeline}
                  className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  파이프라인에서 확인하기 →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
