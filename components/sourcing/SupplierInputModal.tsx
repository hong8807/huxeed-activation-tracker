'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SupplierInputModalProps {
  productName: string
  onClose: () => void
}

interface SupplierFormData {
  id: string
  supplier_name: string
  currency: string
  unit_price_foreign: number
  fx_rate: number
  dmf_registered: boolean
  linkage_status: string
  note: string
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: '미국 달러 (USD)', symbol: '$' },
  { value: 'EUR', label: '유럽 유로 (EUR)', symbol: '€' },
  { value: 'CNY', label: '중국 위안 (CNY)', symbol: '¥' },
  { value: 'JPY', label: '일본 엔 (JPY)', symbol: '¥' },
  { value: 'KRW', label: '한국 원 (KRW)', symbol: '₩' }
]

const DMF_OPTIONS = [
  { value: true, label: 'O (등록됨)' },
  { value: false, label: 'X (미등록)' }
]

const LINKAGE_STATUS_OPTIONS = [
  { value: 'PREPARING', label: '준비중' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'COMPLETED', label: '완료' }
]

export default function SupplierInputModal({ productName, onClose }: SupplierInputModalProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // 제조원 목록 관리
  const [suppliers, setSuppliers] = useState<SupplierFormData[]>([
    {
      id: crypto.randomUUID(),
      supplier_name: '',
      currency: 'USD',
      unit_price_foreign: 0,
      fx_rate: 1430,
      dmf_registered: false,
      linkage_status: 'PREPARING',
      note: ''
    }
  ])

  // 제조원 추가
  const addSupplier = () => {
    setSuppliers([
      ...suppliers,
      {
        id: crypto.randomUUID(),
        supplier_name: '',
        currency: 'USD',
        unit_price_foreign: 0,
        fx_rate: 1430,
        dmf_registered: false,
        linkage_status: 'PREPARING',
        note: ''
      }
    ])
  }

  // 제조원 삭제
  const removeSupplier = (id: string) => {
    if (suppliers.length === 1) {
      alert('최소 1개의 제조원 정보가 필요합니다.')
      return
    }
    setSuppliers(suppliers.filter(s => s.id !== id))
  }

  // 제조원 정보 업데이트
  const updateSupplier = (id: string, field: keyof SupplierFormData, value: any) => {
    setSuppliers(suppliers.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    for (let i = 0; i < suppliers.length; i++) {
      const supplier = suppliers[i]

      if (!supplier.supplier_name.trim()) {
        alert(`제조원 ${i + 1}: 제조원명을 입력해주세요.`)
        return
      }

      if (!supplier.unit_price_foreign || supplier.unit_price_foreign <= 0) {
        alert(`제조원 ${i + 1}: 단가를 입력해주세요.`)
        return
      }

      if (!supplier.fx_rate || supplier.fx_rate <= 0) {
        alert(`제조원 ${i + 1}: 환율을 입력해주세요.`)
        return
      }
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/suppliers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productName,
          suppliers: suppliers.map(s => ({
            supplier_name: s.supplier_name.trim(),
            currency: s.currency,
            unit_price_foreign: s.unit_price_foreign,
            fx_rate: s.fx_rate,
            unit_price_krw: s.unit_price_foreign * s.fx_rate,
            dmf_registered: s.dmf_registered,
            linkage_status: s.linkage_status,
            note: s.note.trim() || null
          }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '제조원 정보 등록에 실패했습니다.')
      }

      // 성공 시 페이지 새로고침
      router.refresh()
      onClose()
    } catch (error) {
      console.error('Error saving suppliers:', error)
      alert(error instanceof Error ? error.message : '제조원 정보 등록에 실패했습니다.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">제조원 정보 등록</h2>
              <p className="text-sm text-gray-600 mt-1">
                품목: <strong>{productName}</strong> | 제조원 {suppliers.length}개
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* 제조원 목록 */}
            {suppliers.map((supplier, index) => (
              <div key={supplier.id} className="bg-gray-50 rounded-lg p-5 border-2 border-gray-200 relative">
                {/* 제조원 번호 및 삭제 버튼 */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    제조원 {index + 1}
                  </h3>
                  {suppliers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSupplier(supplier.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      삭제
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 제조원명 */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제조원명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={supplier.supplier_name}
                      onChange={(e) => updateSupplier(supplier.id, 'supplier_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="제조원명을 입력하세요"
                      required
                    />
                  </div>

                  {/* 통화 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      통화 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={supplier.currency}
                      onChange={(e) => updateSupplier(supplier.id, 'currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {CURRENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 단가 (외화) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      단가 (외화) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={supplier.unit_price_foreign || ''}
                      onChange={(e) => updateSupplier(supplier.id, 'unit_price_foreign', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="단가"
                      required
                    />
                  </div>

                  {/* 환율 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      환율 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={supplier.fx_rate || ''}
                      onChange={(e) => updateSupplier(supplier.id, 'fx_rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="환율"
                      required
                    />
                  </div>

                  {/* KRW 환산 원가 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      KRW 환산 원가
                    </label>
                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-semibold">
                      ₩{(supplier.unit_price_foreign * supplier.fx_rate).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  {/* DMF 등록여부 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      DMF 등록여부
                    </label>
                    <div className="flex gap-4">
                      {DMF_OPTIONS.map((option) => (
                        <label key={option.label} className="flex items-center">
                          <input
                            type="radio"
                            checked={supplier.dmf_registered === option.value}
                            onChange={() => updateSupplier(supplier.id, 'dmf_registered', option.value)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 완제연계심사 상태 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      완제연계심사 상태
                    </label>
                    <select
                      value={supplier.linkage_status}
                      onChange={(e) => updateSupplier(supplier.id, 'linkage_status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {LINKAGE_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 비고 */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      비고
                    </label>
                    <textarea
                      value={supplier.note}
                      onChange={(e) => updateSupplier(supplier.id, 'note', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="추가 정보를 입력하세요 (선택사항)"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* 제조원 추가 버튼 */}
            <button
              type="button"
              onClick={addSupplier}
              className="w-full px-4 py-3 text-sm font-medium text-orange-600 bg-orange-50 border-2 border-dashed border-orange-300 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              제조원 추가
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    등록 중...
                  </>
                ) : (
                  `${suppliers.length}개 제조원 등록`
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
