'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, CloudArrowUpIcon, DocumentArrowDownIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface UploadResult {
  success: boolean
  inserted_count: number
  error_rows: Array<{ row: number; reason: string }>
}

export default function MeetingsUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null) // 새 파일 선택 시 결과 초기화
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert('파일을 선택해주세요')
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/meetings/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '업로드 실패')
      }

      setResult(data)
    } catch (error) {
      console.error('Upload error:', error)
      alert(`업로드 중 오류 발생: ${error}`)
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    // 간단한 엑셀 템플릿 생성 (실제로는 서버에서 제공하거나 미리 만들어진 파일 다운로드)
    const link = document.createElement('a')
    link.href = '/회의실행항목_템플릿.xlsx' // public 폴더에 템플릿 파일 필요
    link.download = '회의실행항목_템플릿.xlsx'
    link.click()
  }

  return (
    <div className="min-h-screen bg-[#f7f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e5dc]">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <Link
            href="/meetings"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#95c11f] mb-4 font-semibold"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            회의 실행 항목 목록으로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">회의 실행 항목 엑셀 업로드</h1>
          <p className="mt-1 text-sm text-gray-600">
            회의에서 나온 실행 항목을 엑셀 파일로 일괄 등록하세요
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Template Download */}
        <div className="bg-white rounded-xl border border-[#e2e5dc] p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. 엑셀 템플릿 다운로드</h2>
          <p className="text-sm text-gray-600 mb-4">
            아래 버튼을 클릭하여 엑셀 양식을 다운로드하세요
          </p>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors font-semibold"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            엑셀 템플릿 다운로드
          </button>
        </div>

        {/* Upload Instructions */}
        <div className="bg-white rounded-xl border border-[#e2e5dc] p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. 엑셀 작성 가이드</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#95c11f] text-white rounded-full flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <strong>회의제목</strong>: 다음 4가지 중 하나를 정확히 입력
                <div className="mt-1 flex gap-2 flex-wrap">
                  {['일간회의', '월간회의', '분기회의', '년마감회의'].map(type => (
                    <span key={type} className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#95c11f] text-white rounded-full flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <strong>일시</strong>: 날짜만 입력 (형식: YYYY-MM-DD, 예: 2025-11-20)
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#95c11f] text-white rounded-full flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <strong>거래처명</strong>: 관련 거래처명 (선택사항, 예: 한미약품, 대웅제약)
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#95c11f] text-white rounded-full flex items-center justify-center font-bold text-xs">
                4
              </div>
              <div>
                <strong>내용</strong>: 실행이 필요한 회의 내용 (한 줄 액션 아이템으로 작성 권장)
              </div>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-xl border border-[#e2e5dc] p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. 엑셀 파일 업로드</h2>

          {/* Drag & Drop Zone */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#95c11f] transition-colors">
            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-[#95c11f] hover:text-[#7aa619] font-semibold"
            >
              파일 선택
            </label>
            <span className="text-gray-600"> 또는 여기에 파일을 드롭하세요</span>

            {file && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 font-semibold">{file.name}</span>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`mt-4 w-full py-3 rounded-md font-bold text-white transition-colors ${
              !file || uploading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-[#95c11f] hover:bg-[#7aa619]'
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                업로드 중...
              </span>
            ) : (
              '업로드 시작'
            )}
          </button>
        </div>

        {/* Upload Result */}
        {result && (
          <div className={`rounded-xl border p-6 ${
            result.error_rows.length === 0
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              {result.error_rows.length === 0 ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`font-bold mb-2 ${
                  result.error_rows.length === 0 ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  업로드 완료
                </h3>
                <p className={`text-sm mb-3 ${
                  result.error_rows.length === 0 ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  총 <strong>{result.inserted_count + result.error_rows.length}건</strong> 중{' '}
                  <strong className="text-green-600">{result.inserted_count}건 성공</strong>
                  {result.error_rows.length > 0 && (
                    <>, <strong className="text-red-600">{result.error_rows.length}건 실패</strong></>
                  )}
                </p>

                {/* Error Details */}
                {result.error_rows.length > 0 && (
                  <div className="mt-4 p-4 bg-white rounded-md border border-yellow-300">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">에러 상세:</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {result.error_rows.map((error, idx) => (
                        <li key={idx}>
                          <strong className="text-red-600">행 {error.row}:</strong> {error.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Success - Link to list */}
                {result.inserted_count > 0 && (
                  <Link
                    href="/meetings"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#95c11f] text-white rounded-md hover:bg-[#7aa619] transition-colors font-semibold text-sm"
                  >
                    회의 실행 항목 목록에서 확인하기 →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
