'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDateShort, normalizeProductName } from '@/utils/format'

interface SupplierManagementModalProps {
  productName: string
  onClose: () => void
}

interface ExistingSupplier {
  id: string
  product_name: string
  supplier_name: string
  created_by_name: string | null  // v2.5: 입력자명
  currency: string
  unit_price_foreign: number
  fx_rate: number
  tariff_rate: number | null  // v2.5: 관세율
  additional_cost_rate: number | null  // v2.5: 부대비용율
  unit_price_krw: number
  dmf_registered: boolean
  linkage_status: string
  note: string | null
  created_at: string
}

interface NewSupplierFormData {
  id: string
  supplier_name: string
  created_by_name: string  // v2.5: 입력자명
  currency: string
  unit_price_foreign: number
  fx_rate: number
  tariff_rate: number  // v2.5: 관세율 (%)
  additional_cost_rate: number  // v2.5: 부대비용율 (%)
  dmf_registered: boolean
  linkage_status: string
  note: string
  files: File[]  // 첨부 파일 목록
}

interface UploadedDocument {
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

const CURRENCY_OPTIONS = [
  { value: 'USD', label: '미국 달러 (USD)', symbol: '$' },
  { value: 'EUR', label: '유럽 유로 (EUR)', symbol: '€' },
  { value: 'CNY', label: '중국 위안 (CNY)', symbol: '¥' },
  { value: 'JPY', label: '일본 엔 (JPY)', symbol: '¥' },
  { value: 'KRW', label: '한국 원 (KRW)', symbol: '₩' }
]

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  CNY: '¥',
  JPY: '¥',
  KRW: '₩'
}

const DMF_OPTIONS = [
  { value: true, label: 'O (등록됨)' },
  { value: false, label: 'X (미등록)' }
]

const LINKAGE_STATUS_OPTIONS = [
  { value: 'PREPARING', label: '준비중' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'COMPLETED', label: '완료' }
]

const LINKAGE_STATUS_LABELS: Record<string, string> = {
  PREPARING: '준비중',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료'
}

export default function SupplierManagementModal({ productName, onClose }: SupplierManagementModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [existingSuppliers, setExistingSuppliers] = useState<ExistingSupplier[]>([])
  const [newSuppliers, setNewSuppliers] = useState<NewSupplierFormData[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<ExistingSupplier | null>(null)  // v2.5: 수정 모드
  const [editingFiles, setEditingFiles] = useState<File[]>([])  // 수정 모드용 파일 배열
  const [supplierSuggestions, setSupplierSuggestions] = useState<string[]>([])  // 자동완성 데이터
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedDocument[]>>({})  // 제조원별 업로드된 파일 목록

  useEffect(() => {
    fetchExistingSuppliers()
    fetchSupplierSuggestions()
  }, [productName])

  // 제조원명 자동완성 데이터 로드
  const fetchSupplierSuggestions = async () => {
    try {
      const response = await fetch('/api/autocomplete/suppliers')
      if (response.ok) {
        const suppliers = await response.json()
        setSupplierSuggestions(suppliers)
      }
    } catch (error) {
      console.error('Failed to fetch supplier suggestions:', error)
    }
  }

  // 환율 자동 조회 함수
  const fetchExchangeRate = async (currency: string): Promise<number> => {
    if (currency === 'KRW') {
      console.log('💱 KRW: 환율 1로 고정')
      return 1
    }

    console.log(`💱 환율 조회 시작: ${currency}`)

    try {
      const response = await fetch(`/api/exchange-rate?currency=${currency}`)
      console.log(`💱 환율 API 응답:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${currency} 환율 조회 성공: ${data.rate}`)
        return data.rate
      } else {
        const errorText = await response.text()
        console.error(`❌ 환율 API 에러 (${response.status}):`, errorText.substring(0, 200))
      }
    } catch (error) {
      console.error('❌ 환율 조회 실패:', error)
    }

    // 실패 시 기본값 반환
    const defaultRate = currency === 'USD' ? 1430 : 1
    console.log(`⚠️ 기본 환율 사용: ${currency} = ${defaultRate}`)
    return defaultRate
  }

  const fetchExistingSuppliers = async () => {
    setIsLoading(true)
    try {
      const normalizedName = normalizeProductName(productName)
      const response = await fetch(`/api/suppliers/by-product?productName=${encodeURIComponent(normalizedName)}`)

      if (!response.ok) throw new Error('Failed to fetch suppliers')

      const data = await response.json()

      // supplier_name 기준으로 중복 제거 (동일한 제조원은 1개만 표시)
      const uniqueSuppliers = data.reduce((acc: ExistingSupplier[], supplier: ExistingSupplier) => {
        // 이미 같은 supplier_name이 있는지 확인
        const exists = acc.find(s => s.supplier_name === supplier.supplier_name)

        if (!exists) {
          // 없으면 추가
          acc.push(supplier)
        } else {
          // 있으면 더 최신 것으로 교체 (created_at 기준)
          if (new Date(supplier.created_at) > new Date(exists.created_at)) {
            const index = acc.indexOf(exists)
            acc[index] = supplier
          }
        }

        return acc
      }, [])

      setExistingSuppliers(uniqueSuppliers)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSupplier = async (supplierName: string) => {
    if (!confirm(`"${supplierName}" 제조원 정보를 삭제하시겠습니까?\n\n이 품목의 모든 거래처에서 해당 제조원 정보가 삭제됩니다.`)) return

    try {
      const response = await fetch(
        `/api/suppliers/delete-by-name?productName=${encodeURIComponent(productName)}&supplierName=${encodeURIComponent(supplierName)}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Failed to delete supplier')

      const result = await response.json()
      console.log(`✅ ${result.deleted_count}개 제조원 정보 삭제 완료`)

      if (result.rolled_back) {
        console.log(`🔄 제조원이 모두 삭제되어 관련 카드가 소싱요청 단계로 되돌아갔습니다.`)
      }

      // 목록에서 제거
      setExistingSuppliers(existingSuppliers.filter(s => s.supplier_name !== supplierName))

      // 제조원이 모두 삭제된 경우 모달 닫고 페이지 새로고침
      if (result.remaining_suppliers === 0) {
        alert('제조원이 모두 삭제되어 관련 카드가 소싱요청 단계로 되돌아갔습니다.')
        onClose()
        router.refresh()
        // 페이지 강제 새로고침
        window.location.reload()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert('제조원 삭제에 실패했습니다.')
    }
  }

  // v2.5: 제조원 수정 핸들러
  const handleEditSupplier = (supplier: ExistingSupplier) => {
    setEditingSupplier({ ...supplier })
  }

  const handleCancelEdit = () => {
    setEditingSupplier(null)
    setEditingFiles([])  // 파일 상태 초기화
  }

  const handleUpdateSupplier = async () => {
    if (!editingSupplier) return

    // 유효성 검사
    if (!editingSupplier.supplier_name.trim()) {
      alert('제조원명을 입력해주세요.')
      return
    }

    if (!editingSupplier.created_by_name?.trim()) {
      alert('입력자명을 입력해주세요.')
      return
    }

    if (!editingSupplier.unit_price_foreign || editingSupplier.unit_price_foreign <= 0) {
      alert('단가를 입력해주세요.')
      return
    }

    if (!editingSupplier.fx_rate || editingSupplier.fx_rate <= 0) {
      alert('환율을 입력해주세요.')
      return
    }

    setIsSaving(true)

    try {
      // 최종 KRW 계산
      const baseKRW = editingSupplier.unit_price_foreign * editingSupplier.fx_rate
      const tariffMultiplier = 1 + (editingSupplier.tariff_rate || 0) / 100
      const additionalCostMultiplier = 1 + (editingSupplier.additional_cost_rate || 0) / 100
      const finalKRW = baseKRW * tariffMultiplier * additionalCostMultiplier

      const response = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_name: editingSupplier.supplier_name.trim(),
          created_by_name: editingSupplier.created_by_name.trim(),
          currency: editingSupplier.currency,
          unit_price_foreign: editingSupplier.unit_price_foreign,
          fx_rate: editingSupplier.fx_rate,
          tariff_rate: editingSupplier.tariff_rate || 0,
          additional_cost_rate: editingSupplier.additional_cost_rate || 0,
          unit_price_krw: finalKRW,
          dmf_registered: editingSupplier.dmf_registered,
          linkage_status: editingSupplier.linkage_status,
          note: editingSupplier.note?.trim() || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '제조원 정보 수정에 실패했습니다.')
      }

      // 파일 업로드 (파일이 있는 경우)
      if (editingFiles.length > 0) {
        await uploadFiles(editingSupplier.id, editingSupplier.supplier_name, editingFiles, editingSupplier.created_by_name || 'Unknown')
      }

      // 목록 업데이트
      setExistingSuppliers(existingSuppliers.map(s =>
        s.id === editingSupplier.id ? { ...editingSupplier, unit_price_krw: finalKRW } : s
      ))
      setEditingSupplier(null)
      setEditingFiles([])  // 파일 상태 초기화
      router.refresh()
    } catch (error) {
      console.error('Error updating supplier:', error)
      alert(error instanceof Error ? error.message : '제조원 정보 수정에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const updateEditingSupplier = (field: keyof ExistingSupplier, value: any) => {
    if (!editingSupplier) return
    setEditingSupplier({ ...editingSupplier, [field]: value })
  }

  // 수정 모드 통화 변경 핸들러 (환율 자동 조회)
  const handleCurrencyChangeForEdit = async (currency: string) => {
    if (!editingSupplier) return

    // 환율 자동 조회
    const rate = await fetchExchangeRate(currency)

    // 통화와 환율을 한 번에 업데이트
    setEditingSupplier({ ...editingSupplier, currency, fx_rate: rate })
  }

  const addNewSupplier = async () => {
    // USD 환율 자동 조회
    const usdRate = await fetchExchangeRate('USD')

    setNewSuppliers([
      ...newSuppliers,
      {
        id: crypto.randomUUID(),
        supplier_name: '',
        created_by_name: '',  // v2.5: 입력자명
        currency: 'USD',
        unit_price_foreign: 0,
        fx_rate: usdRate,  // 자동 조회된 USD 환율
        tariff_rate: 0,  // v2.5: 관세율 (%) 기본값 0
        additional_cost_rate: 0,  // v2.5: 부대비용율 (%) 기본값 0
        dmf_registered: false,
        linkage_status: 'PREPARING',
        note: '',
        files: []  // 빈 파일 배열
      }
    ])
    setShowAddForm(true)
  }

  const handleFileSelect = (id: string, files: FileList | null) => {
    if (!files) return

    setNewSuppliers(newSuppliers.map(s =>
      s.id === id ? { ...s, files: Array.from(files) } : s
    ))
  }

  const removeNewSupplier = (id: string) => {
    const filtered = newSuppliers.filter(s => s.id !== id)
    setNewSuppliers(filtered)
    if (filtered.length === 0) {
      setShowAddForm(false)
    }
  }

  const updateNewSupplier = (id: string, field: keyof NewSupplierFormData, value: any) => {
    setNewSuppliers(newSuppliers.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  // 신규 제조원 통화 변경 핸들러 (환율 자동 조회)
  const handleCurrencyChangeForNew = async (id: string, currency: string) => {
    // 환율 자동 조회
    const rate = await fetchExchangeRate(currency)

    // 통화와 환율을 한 번에 업데이트
    setNewSuppliers(newSuppliers.map(s =>
      s.id === id ? { ...s, currency, fx_rate: rate } : s
    ))
  }

  const uploadFiles = async (supplierId: string, supplierName: string, files: File[], uploadedBy: string) => {
    const uploadedDocs: UploadedDocument[] = []

    console.log('📤 Starting file upload:', {
      fileCount: files.length,
      supplierId,
      supplierName,
      uploadedBy,
      productName
    })

    for (const file of files) {
      console.log('📁 Uploading file:', file.name, file.size, file.type)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('supplier_id', supplierId)  // uuid string 그대로
      formData.append('product_name', productName)
      formData.append('supplier_name', supplierName)
      formData.append('uploaded_by', uploadedBy)

      try {
        const response = await fetch('/api/upload-document', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          // 응답이 JSON인지 HTML인지 확인
          const contentType = response.headers.get('content-type')
          console.error('Upload failed:', {
            status: response.status,
            statusText: response.statusText,
            contentType
          })

          if (contentType?.includes('application/json')) {
            const error = await response.json()
            throw new Error(error.error || '파일 업로드 실패')
          } else {
            // HTML 에러 페이지인 경우
            const text = await response.text()
            console.error('Error response (HTML):', text.substring(0, 500))
            throw new Error(`파일 업로드 실패 (${response.status}): 서버 에러 발생`)
          }
        }

        const result = await response.json()
        uploadedDocs.push(result.document)
      } catch (error) {
        console.error('File upload error:', error)
        throw error
      }
    }

    return uploadedDocs
  }

  const handleSaveNewSuppliers = async () => {
    // 유효성 검사
    for (let i = 0; i < newSuppliers.length; i++) {
      const supplier = newSuppliers[i]

      if (!supplier.supplier_name.trim()) {
        alert(`제조원 ${i + 1}: 제조원명을 입력해주세요.`)
        return
      }

      if (!supplier.created_by_name.trim()) {
        alert(`제조원 ${i + 1}: 입력자명을 입력해주세요.`)
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
          suppliers: newSuppliers.map(s => {
            // v2.5: 관세 + 부대비용 반영한 최종 KRW 계산
            const baseKRW = s.unit_price_foreign * s.fx_rate
            const tariffMultiplier = 1 + (s.tariff_rate || 0) / 100
            const additionalCostMultiplier = 1 + (s.additional_cost_rate || 0) / 100
            const finalKRW = baseKRW * tariffMultiplier * additionalCostMultiplier

            return {
              supplier_name: s.supplier_name.trim(),
              created_by_name: s.created_by_name.trim(),  // v2.5: 입력자명
              currency: s.currency,
              unit_price_foreign: s.unit_price_foreign,
              fx_rate: s.fx_rate,
              tariff_rate: s.tariff_rate || 0,  // v2.5: 관세율
              additional_cost_rate: s.additional_cost_rate || 0,  // v2.5: 부대비용율
              unit_price_krw: finalKRW,  // v2.5: 최종 KRW
              dmf_registered: s.dmf_registered,
              linkage_status: s.linkage_status,
              note: s.note.trim() || null
            }
          })
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '제조원 정보 등록에 실패했습니다.')
      }

      // 성공 시 신규 제조원 목록 초기화 및 기존 제조원 목록 갱신
      const result = await response.json()

      // 파일 업로드 (각 제조원별)
      for (let i = 0; i < newSuppliers.length; i++) {
        const supplier = newSuppliers[i]
        if (supplier.files && supplier.files.length > 0) {
          try {
            // API에서 반환된 uuid 사용
            const supplierId = result.inserted_ids?.[i]
            if (supplierId) {
              await uploadFiles(
                supplierId,  // uuid string
                supplier.supplier_name,
                supplier.files,
                supplier.created_by_name
              )
            }
          } catch (error) {
            console.error(`제조원 ${supplier.supplier_name} 파일 업로드 실패:`, error)
            // 파일 업로드 실패해도 제조원 정보는 이미 저장되었으므로 계속 진행
          }
        }
      }

      // 신규 입력 폼 초기화
      setNewSuppliers([])

      // 기존 제조원 목록에 추가 (낙관적 업데이트)
      const savedSuppliers = newSuppliers.map(s => {
        const baseKRW = s.unit_price_foreign * s.fx_rate
        const tariffMultiplier = 1 + (s.tariff_rate || 0) / 100
        const additionalCostMultiplier = 1 + (s.additional_cost_rate || 0) / 100
        const finalKRW = baseKRW * tariffMultiplier * additionalCostMultiplier

        return {
          id: crypto.randomUUID(), // 임시 ID
          target_id: '', // 임시
          product_name: productName,
          supplier_name: s.supplier_name.trim(),
          created_by_name: s.created_by_name.trim(),
          currency: s.currency,
          unit_price_foreign: s.unit_price_foreign,
          fx_rate: s.fx_rate,
          tariff_rate: s.tariff_rate || 0,
          additional_cost_rate: s.additional_cost_rate || 0,
          unit_price_krw: finalKRW,
          dmf_registered: s.dmf_registered,
          linkage_status: s.linkage_status,
          note: s.note.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

      setExistingSuppliers([...existingSuppliers, ...savedSuppliers])

      // 성공 메시지
      alert(`${newSuppliers.length}개의 제조원 정보가 등록되었습니다.`)

      // 페이지 데이터 갱신 (백그라운드)
      router.refresh()

      setIsSaving(false)
    } catch (error) {
      console.error('Error saving suppliers:', error)
      alert(error instanceof Error ? error.message : '제조원 정보 등록에 실패했습니다.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">제조원 관리</h2>
              <p className="text-sm text-gray-600 mt-1">
                품목: <strong>{productName}</strong>
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
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 기존 제조원 목록 */}
              {existingSuppliers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    등록된 제조원 ({existingSuppliers.length}개)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {existingSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-4 relative"
                      >
                        {/* 수정/삭제 버튼 */}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button
                            onClick={() => handleEditSupplier(supplier)}
                            className="text-blue-600 hover:text-blue-800"
                            title="수정"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier.supplier_name)}
                            className="text-red-600 hover:text-red-800"
                            title="삭제"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div className="mb-3 pb-2 border-b-2 border-yellow-300">
                          <h4 className="font-bold text-gray-900">{supplier.supplier_name}</h4>
                          <span className="text-xs text-gray-500">등록일: {formatDateShort(supplier.created_at)}</span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">단가:</span>
                            <span className="font-semibold">
                              {CURRENCY_SYMBOLS[supplier.currency]}{supplier.unit_price_foreign.toLocaleString('ko-KR', { maximumFractionDigits: 2 })} {supplier.currency}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">환율:</span>
                            <span className="font-semibold">{supplier.fx_rate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">KRW 원가:</span>
                            <span className="font-bold text-blue-600">₩{supplier.unit_price_krw.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-yellow-200">
                            <span className="text-gray-600">DMF:</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              supplier.dmf_registered
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {supplier.dmf_registered ? 'O' : 'X'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">연계심사:</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              supplier.linkage_status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : supplier.linkage_status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {LINKAGE_STATUS_LABELS[supplier.linkage_status] || supplier.linkage_status}
                            </span>
                          </div>
                          {supplier.note && (
                            <div className="pt-2 border-t border-yellow-200">
                              <p className="text-gray-700 text-xs whitespace-pre-wrap">{supplier.note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 새로운 제조원 추가 버튼 */}
              {!showAddForm && (
                <button
                  onClick={addNewSupplier}
                  className="w-full px-4 py-3 text-sm font-medium text-orange-600 bg-orange-50 border-2 border-dashed border-orange-300 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  새로운 제조원 추가
                </button>
              )}

              {/* 새로운 제조원 입력 폼 */}
              {showAddForm && newSuppliers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    새로운 제조원 추가 ({newSuppliers.length}개)
                  </h3>
                  <div className="space-y-4">
                    {newSuppliers.map((supplier, index) => (
                      <div key={supplier.id} className="bg-gray-50 rounded-lg p-5 border-2 border-gray-200 relative">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">제조원 {index + 1}</h4>
                          <button
                            onClick={() => removeNewSupplier(supplier.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            삭제
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* 제조원명 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              제조원명 <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(자동완성)</span>
                            </label>
                            <input
                              type="text"
                              value={supplier.supplier_name}
                              onChange={(e) => updateNewSupplier(supplier.id, 'supplier_name', e.target.value)}
                              list="supplier-suggestions"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-yellow-50"
                              placeholder="제조원명을 입력하세요"
                              required
                            />
                            <datalist id="supplier-suggestions">
                              {supplierSuggestions.map((supplierName) => (
                                <option key={supplierName} value={supplierName} />
                              ))}
                            </datalist>
                          </div>

                          {/* 입력자명 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              입력자명 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={supplier.created_by_name}
                              onChange={(e) => updateNewSupplier(supplier.id, 'created_by_name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-yellow-50"
                              placeholder="입력자명을 입력하세요"
                              required
                            />
                          </div>

                          {/* 통화 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              통화 <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={supplier.currency}
                              onChange={(e) => handleCurrencyChangeForNew(supplier.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                              {CURRENCY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 단가 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              단가 (외화) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={supplier.unit_price_foreign || ''}
                              onChange={(e) => updateNewSupplier(supplier.id, 'unit_price_foreign', parseFloat(e.target.value) || 0)}
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
                              onChange={(e) => updateNewSupplier(supplier.id, 'fx_rate', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-yellow-50"
                              placeholder="환율"
                              required
                            />
                          </div>

                          {/* 관세율 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              관세율 (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={supplier.tariff_rate || ''}
                              onChange={(e) => updateNewSupplier(supplier.id, 'tariff_rate', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-yellow-50"
                              placeholder="0"
                            />
                          </div>

                          {/* 부대비용율 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              부대비용율 (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={supplier.additional_cost_rate || ''}
                              onChange={(e) => updateNewSupplier(supplier.id, 'additional_cost_rate', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-yellow-50"
                              placeholder="0"
                            />
                          </div>

                          {/* KRW 환산 원가 (상세) */}
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              최종 KRW 원가
                            </label>
                            {(() => {
                              const baseKRW = supplier.unit_price_foreign * supplier.fx_rate
                              const tariffAmount = baseKRW * ((supplier.tariff_rate || 0) / 100)
                              const additionalCostAmount = baseKRW * ((supplier.additional_cost_rate || 0) / 100)
                              const finalKRW = baseKRW + tariffAmount + additionalCostAmount

                              return (
                                <div className="space-y-2">
                                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="flex justify-between text-sm text-gray-600">
                                      <span>소싱 원가 (기본):</span>
                                      <span>₩{baseKRW.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    {(supplier.tariff_rate || 0) > 0 && (
                                      <div className="flex justify-between text-sm text-gray-600">
                                        <span>+ 관세 ({supplier.tariff_rate}%):</span>
                                        <span>₩{tariffAmount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</span>
                                      </div>
                                    )}
                                    {(supplier.additional_cost_rate || 0) > 0 && (
                                      <div className="flex justify-between text-sm text-gray-600">
                                        <span>+ 부대비용 ({supplier.additional_cost_rate}%):</span>
                                        <span>₩{additionalCostAmount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</span>
                                      </div>
                                    )}
                                    <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold text-blue-900">
                                      <span>최종 원가:</span>
                                      <span>₩{finalKRW.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>

                          {/* DMF */}
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
                                    onChange={() => updateNewSupplier(supplier.id, 'dmf_registered', option.value)}
                                    className="mr-2"
                                  />
                                  <span className="text-sm text-gray-700">{option.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* 연계심사 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              완제연계심사 상태
                            </label>
                            <select
                              value={supplier.linkage_status}
                              onChange={(e) => updateNewSupplier(supplier.id, 'linkage_status', e.target.value)}
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
                              onChange={(e) => updateNewSupplier(supplier.id, 'note', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="추가 정보를 입력하세요 (선택사항)"
                            />
                          </div>

                          {/* 파일 업로드 */}
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              첨부 파일 (선택사항)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-orange-400 transition-colors">
                              <input
                                type="file"
                                multiple
                                onChange={(e) => handleFileSelect(supplier.id, e.target.files)}
                                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                              />
                              <p className="text-xs text-gray-500 mt-2">
                                PDF, Word, Excel, 이미지 파일 (최대 50MB)
                              </p>
                              {supplier.files && supplier.files.length > 0 && (
                                <div className="mt-3 space-y-1">
                                  <p className="text-sm font-medium text-gray-700">선택된 파일 ({supplier.files.length}개):</p>
                                  {supplier.files.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span>{file.name}</span>
                                      <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 추가 제조원 버튼 */}
                    <button
                      onClick={addNewSupplier}
                      className="w-full px-4 py-3 text-sm font-medium text-orange-600 bg-orange-50 border-2 border-dashed border-orange-300 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      제조원 추가
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {showAddForm && newSuppliers.length > 0 ? '취소' : '닫기'}
            </button>
            {showAddForm && newSuppliers.length > 0 && (
              <button
                onClick={handleSaveNewSuppliers}
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
                  `${newSuppliers.length}개 제조원 등록`
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
      {editingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">제조원 정보 수정</h3>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="grid grid-cols-2 gap-4">
                {/* 제조원명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제조원명 <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(자동완성)</span>
                  </label>
                  <input
                    type="text"
                    value={editingSupplier.supplier_name}
                    onChange={(e) => updateEditingSupplier('supplier_name', e.target.value)}
                    list="supplier-suggestions-edit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                    placeholder="제조원명"
                  />
                  <datalist id="supplier-suggestions-edit">
                    {supplierSuggestions.map((supplierName) => (
                      <option key={supplierName} value={supplierName} />
                    ))}
                  </datalist>
                </div>

                {/* 입력자명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    입력자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingSupplier.created_by_name || ''}
                    onChange={(e) => updateEditingSupplier('created_by_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                    placeholder="입력자명"
                  />
                </div>

                {/* 통화 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    통화 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingSupplier.currency}
                    onChange={(e) => handleCurrencyChangeForEdit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {CURRENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 단가 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    단가 (외화) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSupplier.unit_price_foreign}
                    onChange={(e) => updateEditingSupplier('unit_price_foreign', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-yellow-50"
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
                    value={editingSupplier.fx_rate}
                    onChange={(e) => updateEditingSupplier('fx_rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                  />
                </div>

                {/* 관세율 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    관세율 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingSupplier.tariff_rate || 0}
                    onChange={(e) => updateEditingSupplier('tariff_rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                  />
                </div>

                {/* 부대비용율 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    부대비용율 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingSupplier.additional_cost_rate || 0}
                    onChange={(e) => updateEditingSupplier('additional_cost_rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                  />
                </div>

                {/* 최종 KRW 원가 */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최종 KRW 원가
                  </label>
                  {(() => {
                    const baseKRW = editingSupplier.unit_price_foreign * editingSupplier.fx_rate
                    const tariffAmount = baseKRW * ((editingSupplier.tariff_rate || 0) / 100)
                    const additionalCostAmount = baseKRW * ((editingSupplier.additional_cost_rate || 0) / 100)
                    const finalKRW = baseKRW + tariffAmount + additionalCostAmount

                    return (
                      <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>소싱 원가 (기본):</span>
                          <span>₩{baseKRW.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</span>
                        </div>
                        {(editingSupplier.tariff_rate || 0) > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>+ 관세 ({editingSupplier.tariff_rate}%):</span>
                            <span>₩{tariffAmount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</span>
                          </div>
                        )}
                        {(editingSupplier.additional_cost_rate || 0) > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>+ 부대비용 ({editingSupplier.additional_cost_rate}%):</span>
                            <span>₩{additionalCostAmount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</span>
                          </div>
                        )}
                        <div className="border-t border-blue-300 mt-2 pt-2 flex justify-between font-bold text-blue-900">
                          <span>최종 원가:</span>
                          <span>₩{finalKRW.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* DMF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DMF 등록여부
                  </label>
                  <div className="flex gap-4">
                    {DMF_OPTIONS.map((option) => (
                      <label key={option.label} className="flex items-center">
                        <input
                          type="radio"
                          checked={editingSupplier.dmf_registered === option.value}
                          onChange={() => updateEditingSupplier('dmf_registered', option.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 연계심사 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    완제연계심사 상태
                  </label>
                  <select
                    value={editingSupplier.linkage_status}
                    onChange={(e) => updateEditingSupplier('linkage_status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    value={editingSupplier.note || ''}
                    onChange={(e) => updateEditingSupplier('note', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="추가 정보"
                  />
                </div>

                {/* 파일 업로드 */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    첨부 파일 (선택사항)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setEditingFiles(e.target.files ? Array.from(e.target.files) : [])}
                      className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      PDF, Word, Excel, 이미지 파일 (최대 50MB)
                    </p>
                    {editingFiles.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-sm font-medium text-gray-700">선택된 파일 ({editingFiles.length}개):</p>
                        {editingFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{file.name}</span>
                            <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleUpdateSupplier}
                disabled={isSaving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    수정 중...
                  </>
                ) : (
                  '저장'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
