'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CURRENCY_OPTIONS = [
  { value: 'USD', label: '미국 달러 (USD)', symbol: '$' },
  { value: 'EUR', label: '유럽 유로 (EUR)', symbol: '€' },
  { value: 'CNY', label: '중국 위안 (CNY)', symbol: '¥' },
  { value: 'JPY', label: '일본 엔 (JPY)', symbol: '¥' },
  { value: 'KRW', label: '한국 원 (KRW)', symbol: '₩' },
]

export default function AddTargetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // 자동완성 데이터
  const [accountSuggestions, setAccountSuggestions] = useState<string[]>([])
  const [productSuggestions, setProductSuggestions] = useState<string[]>([])

  // 기본 정보
  const [year, setYear] = useState(2025)
  const [accountName, setAccountName] = useState('')
  const [productName, setProductName] = useState('')
  const [estQtyKg, setEstQtyKg] = useState(0)
  const [ownerName, setOwnerName] = useState('')
  const [sales2025Krw, setSales2025Krw] = useState(0)

  // 현재 매입가 정보 없음 체크박스 (v2.11)
  const [noCurrentPrice, setNoCurrentPrice] = useState(false)

  // 현재 매입가
  const [currCurrency, setCurrCurrency] = useState('USD')
  const [currUnitPriceForeign, setCurrUnitPriceForeign] = useState(0)
  const [currFxRateInput, setCurrFxRateInput] = useState(0)
  const [currTariffRate, setCurrTariffRate] = useState(0)  // v2.10: 관세율 (%)
  const [currAdditionalCostRate, setCurrAdditionalCostRate] = useState(0)  // v2.10: 부대비용율 (%)

  // 우리 예상 판매가
  const [ourCurrency, setOurCurrency] = useState('USD')
  const [ourUnitPriceForeign, setOurUnitPriceForeign] = useState(0)
  const [ourFxRateInput, setOurFxRateInput] = useState(0)
  const [ourTariffRate, setOurTariffRate] = useState(0)  // v2.10: 관세율 (%)
  const [ourAdditionalCostRate, setOurAdditionalCostRate] = useState(0)  // v2.10: 부대비용율 (%)

  // 거래처 세그먼트
  const [segment, setSegment] = useState('A')

  // 비고
  const [note, setNote] = useState('')

  // 자동 계산 필드 (v2.11: 현재 매입가 정보 없음 처리)
  // 현재매입 단가 = 외화단가 × 환율 × (1 + 관세율/100 + 부대비용율/100)
  const currUnitPriceKrw = noCurrentPrice ? null : (currUnitPriceForeign * currFxRateInput *
    (1 + (currTariffRate || 0) / 100 + (currAdditionalCostRate || 0) / 100))
  const currTotalKrw = noCurrentPrice ? null : (currUnitPriceKrw! * estQtyKg)

  // 우리예상 단가 = 외화단가 × 환율 × (1 + 관세율/100 + 부대비용율/100)
  const ourUnitPriceKrw = ourUnitPriceForeign * ourFxRateInput *
    (1 + (ourTariffRate || 0) / 100 + (ourAdditionalCostRate || 0) / 100)
  const ourEstRevenueKrw = ourUnitPriceKrw * estQtyKg

  const savingPerKg = noCurrentPrice ? null : (currUnitPriceKrw! - ourUnitPriceKrw)
  const totalSavingKrw = noCurrentPrice ? null : (savingPerKg! * estQtyKg)
  const savingRate = noCurrentPrice ? null : (currUnitPriceKrw! > 0 ? (savingPerKg! / currUnitPriceKrw!) * 100 : 0)

  // 자동완성 데이터 로드
  useEffect(() => {
    const fetchAutocompleteData = async () => {
      try {
        const [accountsRes, productsRes] = await Promise.all([
          fetch('/api/autocomplete/accounts'),
          fetch('/api/autocomplete/products'),
        ])

        if (accountsRes.ok) {
          const accounts = await accountsRes.json()
          setAccountSuggestions(accounts)
        }

        if (productsRes.ok) {
          const products = await productsRes.json()
          setProductSuggestions(products)
        }
      } catch (error) {
        console.error('Failed to fetch autocomplete data:', error)
      }
    }

    fetchAutocompleteData()
  }, [])

  // 현재 매입가 통화 변경 시 환율 자동 조회
  useEffect(() => {
    if (noCurrentPrice) return // 정보 없음 체크 시 환율 조회 안 함

    const fetchExchangeRate = async () => {
      if (currCurrency === 'KRW') {
        setCurrFxRateInput(1)
        return
      }

      try {
        const response = await fetch(`/api/exchange-rate?currency=${currCurrency}`)
        if (response.ok) {
          const data = await response.json()
          setCurrFxRateInput(data.rate)
          console.log(`✅ ${currCurrency} 환율 조회: ${data.rate}`)
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
      }
    }

    fetchExchangeRate()
  }, [currCurrency, noCurrentPrice])

  // 우리 예상 판매가 통화 변경 시 환율 자동 조회
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (ourCurrency === 'KRW') {
        setOurFxRateInput(1)
        return
      }

      try {
        const response = await fetch(`/api/exchange-rate?currency=${ourCurrency}`)
        if (response.ok) {
          const data = await response.json()
          setOurFxRateInput(data.rate)
          console.log(`✅ ${ourCurrency} 환율 조회: ${data.rate}`)
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
      }
    }

    fetchExchangeRate()
  }, [ourCurrency])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          account_name: accountName,
          product_name: productName,
          est_qty_kg: estQtyKg,
          owner_name: ownerName,
          sales_2025_krw: sales2025Krw,
          // v2.11: 현재 매입가 정보 없음 체크 시 null 전송
          curr_currency: noCurrentPrice ? null : currCurrency,
          curr_unit_price_foreign: noCurrentPrice ? null : currUnitPriceForeign,
          curr_fx_rate_input: noCurrentPrice ? null : currFxRateInput,
          curr_tariff_rate: noCurrentPrice ? null : currTariffRate,
          curr_additional_cost_rate: noCurrentPrice ? null : currAdditionalCostRate,
          our_currency: ourCurrency,
          our_unit_price_foreign: ourUnitPriceForeign,
          our_fx_rate_input: ourFxRateInput,
          our_tariff_rate: ourTariffRate,  // v2.10
          our_additional_cost_rate: ourAdditionalCostRate,  // v2.10
          segment,
          note,
        }),
      })

      if (response.ok) {
        alert('신규 품목이 등록되었습니다.')
        router.push('/pipeline')
      } else {
        const error = await response.json()
        alert(`등록 실패: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating target:', error)
      alert('등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">신규 품목 등록</h1>
            <p className="text-gray-600 mt-2">시장조사 단계로 신규 품목을 등록합니다</p>
          </div>
          <Link
            href="/pipeline"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연도 *
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  거래처명 * <span className="text-xs text-gray-500">(자동완성)</span>
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  list="account-suggestions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <datalist id="account-suggestions">
                  {accountSuggestions.map((account) => (
                    <option key={account} value={account} />
                  ))}
                </datalist>
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  품목명 * <span className="text-xs text-gray-500">(자동완성)</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  list="product-suggestions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <datalist id="product-suggestions">
                  {productSuggestions.map((product) => (
                    <option key={product} value={product} />
                  ))}
                </datalist>
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수량 (kg)
                </label>
                <input
                  type="number"
                  value={estQtyKg}
                  onChange={(e) => setEstQtyKg(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당자명
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  25년 매출액 (KRW)
                </label>
                <input
                  type="number"
                  value={sales2025Krw}
                  onChange={(e) => setSales2025Krw(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* 거래처 현재 매입가 */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-orange-900">거래처 현재 매입가</h3>
              <label className="flex items-center gap-2 text-sm text-orange-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noCurrentPrice}
                  onChange={(e) => setNoCurrentPrice(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium">정보 없음</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  통화
                </label>
                <select
                  value={currCurrency}
                  onChange={(e) => setCurrCurrency(e.target.value)}
                  disabled={noCurrentPrice}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  단가 (외화)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currUnitPriceForeign}
                  onChange={(e) => setCurrUnitPriceForeign(Number(e.target.value))}
                  disabled={noCurrentPrice}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-200 disabled:cursor-not-allowed"
                />
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기준환율
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currFxRateInput}
                  onChange={(e) => setCurrFxRateInput(Number(e.target.value))}
                  disabled={noCurrentPrice}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-200 disabled:cursor-not-allowed"
                />
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  관세율 (%) <span className="text-xs text-gray-500">(선택, 기본값 0)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currTariffRate}
                  onChange={(e) => setCurrTariffRate(Number(e.target.value))}
                  disabled={noCurrentPrice}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-200 disabled:cursor-not-allowed"
                  placeholder="0"
                />
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  부대비용율 (%) <span className="text-xs text-gray-500">(선택, 기본값 0)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currAdditionalCostRate}
                  onChange={(e) => setCurrAdditionalCostRate(Number(e.target.value))}
                  disabled={noCurrentPrice}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-200 disabled:cursor-not-allowed"
                  placeholder="0"
                />
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  단가 (KRW) - 자동계산
                </label>
                <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md">
                  {currUnitPriceKrw !== null ? currUnitPriceKrw.toLocaleString('ko-KR') : '정보 없음'}
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  총액 (KRW) - 자동계산
                </label>
                <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md">
                  {currTotalKrw !== null ? currTotalKrw.toLocaleString('ko-KR') : '정보 없음'}
                </div>
              </div>
            </div>
          </div>

          {/* 우리 예상 판매가 */}
          <div className="bg-teal-50 border-l-4 border-teal-500 p-6 rounded-r-lg">
            <h3 className="text-lg font-semibold text-teal-900 mb-4">우리 예상 판매가</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  통화
                </label>
                <select
                  value={ourCurrency}
                  onChange={(e) => setOurCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  단가 (외화)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={ourUnitPriceForeign}
                  onChange={(e) => setOurUnitPriceForeign(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기준환율
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={ourFxRateInput}
                  onChange={(e) => setOurFxRateInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  관세율 (%) <span className="text-xs text-gray-500">(선택, 기본값 0)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={ourTariffRate}
                  onChange={(e) => setOurTariffRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0"
                />
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  부대비용율 (%) <span className="text-xs text-gray-500">(선택, 기본값 0)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={ourAdditionalCostRate}
                  onChange={(e) => setOurAdditionalCostRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0"
                />
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  단가 (KRW) - 자동계산
                </label>
                <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md">
                  {ourUnitPriceKrw.toLocaleString('ko-KR')}
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  예상 매출 (KRW) - 자동계산
                </label>
                <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md">
                  {ourEstRevenueKrw.toLocaleString('ko-KR')}
                </div>
              </div>
            </div>
          </div>

          {/* 절감 분석 */}
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-4">절감 분석 - 자동계산</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  kg당 절감액 (KRW)
                </label>
                <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md">
                  {savingPerKg !== null ? savingPerKg.toLocaleString('ko-KR') : '정보 없음'}
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  총 절감액 (KRW)
                </label>
                <div className={`w-full px-3 py-2 bg-white border rounded-md ${totalSavingKrw !== null && totalSavingKrw < 0 ? 'bg-red-100 border-red-500' : 'border-gray-300'}`}>
                  {totalSavingKrw !== null ? totalSavingKrw.toLocaleString('ko-KR') : '정보 없음'}
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  절감률 (%)
                </label>
                <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md">
                  {savingRate !== null ? `${savingRate.toFixed(2)}%` : '정보 없음'}
                </div>
              </div>
            </div>
          </div>

          {/* 거래처 Segmentation */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">거래처 Segmentation</h3>
            <div className="bg-yellow-100 p-3 rounded">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                세그먼트 *
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="S">S 세그먼트 (Strategic)</option>
                <option value="P">P 세그먼트 (Premium)</option>
                <option value="A">A 세그먼트 (일반)</option>
              </select>
            </div>
          </div>

          {/* 비고 */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">비고</h3>
            <div className="bg-yellow-100 p-3 rounded">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="특이사항이나 메모를 입력하세요"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Link
              href="/pipeline"
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
