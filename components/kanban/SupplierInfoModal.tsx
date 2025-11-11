'use client'

import { useState, useEffect } from 'react'
import { Target } from '@/types/database.types'
import { formatDateShort } from '@/utils/format'

interface Supplier {
  id: string
  target_id: string
  supplier_name: string
  currency: string
  unit_price_foreign: number
  fx_rate: number
  unit_price_krw: number
  dmf_registered: boolean
  linkage_status: string
  note: string | null
  created_at: string
  updated_at: string
}

interface SupplierInfoModalProps {
  target: Target
  onClose: () => void
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  CNY: '¥',
  JPY: '¥',
  KRW: '₩'
}

const LINKAGE_STATUS_LABELS: Record<string, string> = {
  PREPARING: '준비중',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료'
}

export default function SupplierInfoModal({ target, onClose }: SupplierInfoModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSuppliers()
  }, [target.id])

  const fetchSuppliers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/suppliers?targetId=${target.id}`)
      if (!response.ok) throw new Error('Failed to fetch suppliers')

      const data = await response.json()
      setSuppliers(data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">제조원 정보</h2>
              <p className="text-sm text-gray-600 mt-1">
                {target.account_name} - {target.product_name}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-500 text-sm">등록된 제조원 정보가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suppliers.map((supplier, index) => (
                <div
                  key={supplier.id}
                  className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg shadow-md p-5 relative"
                  style={{
                    backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 95%, rgba(0, 0, 0, 0.05) 100%)',
                  }}
                >
                  {/* Sticky Note Pin Effect */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-gray-400 rounded-full opacity-30" />

                  {/* Supplier Index */}
                  {suppliers.length > 1 && (
                    <div className="absolute top-3 right-3 bg-yellow-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {index + 1}
                    </div>
                  )}

                  {/* Supplier Name & Created Date */}
                  <div className="mb-4 pb-3 border-b-2 border-yellow-300">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">{supplier.supplier_name}</h3>
                      <span className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded">
                        등록일: {formatDateShort(supplier.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Supplier Details */}
                  <div className="space-y-3 text-sm">
                    {/* Price Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 font-medium mb-1">단가 (외화)</p>
                        <p className="text-gray-900 font-semibold">
                          {CURRENCY_SYMBOLS[supplier.currency]}{supplier.unit_price_foreign.toLocaleString('ko-KR', { maximumFractionDigits: 2 })} {supplier.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium mb-1">환율</p>
                        <p className="text-gray-900 font-semibold">
                          {supplier.fx_rate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* KRW Price */}
                    <div>
                      <p className="text-gray-600 font-medium mb-1">KRW 환산 원가</p>
                      <p className="text-blue-600 font-bold text-lg">
                        ₩{supplier.unit_price_krw.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    {/* DMF & Linkage Status */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-yellow-200">
                      <div>
                        <p className="text-gray-600 font-medium mb-1">DMF 등록여부</p>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                          supplier.dmf_registered
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {supplier.dmf_registered ? 'O (등록됨)' : 'X (미등록)'}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium mb-1">완제연계심사</p>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                          supplier.linkage_status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : supplier.linkage_status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {LINKAGE_STATUS_LABELS[supplier.linkage_status] || supplier.linkage_status}
                        </span>
                      </div>
                    </div>

                    {/* Note */}
                    {supplier.note && (
                      <div className="pt-2 border-t border-yellow-200">
                        <p className="text-gray-600 font-medium mb-1">비고</p>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{supplier.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              ℹ️ 관련 제조원 추가 문의사항은 무역부에 요청주세요.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
