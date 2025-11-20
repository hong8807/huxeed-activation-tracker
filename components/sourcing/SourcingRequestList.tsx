'use client'

import { useState, useMemo } from 'react'
import { Target } from '@/types/database.types'
import { formatDateShort, normalizeProductName } from '@/utils/format'
import SupplierManagementModal from './SupplierManagementModal'

interface SourcingRequestListProps {
  initialTargets: Target[]
  initialSuppliers: { product_name: string; supplier_name: string; created_by_name: string | null }[]
}

interface ProductGroup {
  product_name: string // 원본 품목명 (표시용)
  normalized_name: string // 정규화된 품목명 (비교용)
  account_count: number
  owner_names: string[]
  created_by_names: string[] // v2.5: 제조원 입력자명 목록
  latest_created_at: string
  sample_target: Target
  supplier_count: number
  current_stages: string[]
}

export default function SourcingRequestList({ initialTargets, initialSuppliers }: SourcingRequestListProps) {
  const [selectedProductName, setSelectedProductName] = useState<string | null>(null)

  // 품목별 제조원 개수 계산 (중복 제거: product_name + supplier_name 기준)
  const supplierCounts = useMemo(() => {
    const counts = new Map<string, Set<string>>()

    initialSuppliers.forEach(supplier => {
      const normalizedProductName = normalizeProductName(supplier.product_name)

      if (!counts.has(normalizedProductName)) {
        counts.set(normalizedProductName, new Set())
      }

      // supplier_name을 Set에 추가 (자동으로 중복 제거)
      counts.get(normalizedProductName)!.add(supplier.supplier_name)
    })

    // Set의 크기를 숫자로 변환
    const result = new Map<string, number>()
    counts.forEach((supplierNames, productName) => {
      result.set(productName, supplierNames.size)
    })

    return result
  }, [initialSuppliers])

  // v2.5: 품목별 제조원 입력자명 수집 (중복 제거)
  const createdByNames = useMemo(() => {
    const names = new Map<string, Set<string>>()

    initialSuppliers.forEach(supplier => {
      const normalizedProductName = normalizeProductName(supplier.product_name)

      if (!names.has(normalizedProductName)) {
        names.set(normalizedProductName, new Set())
      }

      // created_by_name이 있으면 Set에 추가 (자동으로 중복 제거)
      if (supplier.created_by_name) {
        names.get(normalizedProductName)!.add(supplier.created_by_name)
      }
    })

    // Set을 배열로 변환
    const result = new Map<string, string[]>()
    names.forEach((nameSet, productName) => {
      result.set(productName, Array.from(nameSet))
    })

    return result
  }, [initialSuppliers])

  // 품목명 기준으로 그룹화 (정규화된 품목명으로 비교)
  const productGroups = useMemo(() => {
    const groups = new Map<string, ProductGroup>()

    initialTargets.forEach(target => {
      const productName = target.product_name
      const normalizedName = normalizeProductName(productName)

      if (groups.has(normalizedName)) {
        const group = groups.get(normalizedName)!
        group.account_count++
        group.owner_names.push(target.owner_name || '')

        // 현재 단계 추가
        if (target.current_stage && !group.current_stages.includes(target.current_stage)) {
          group.current_stages.push(target.current_stage)
        }

        // 최신 등록일자 업데이트
        if (new Date(target.created_at) > new Date(group.latest_created_at)) {
          group.latest_created_at = target.created_at
        }
      } else {
        groups.set(normalizedName, {
          product_name: productName || '',
          normalized_name: normalizedName,
          account_count: 1,
          owner_names: [target.owner_name || ''],
          created_by_names: createdByNames.get(normalizedName) || [], // v2.5: 제조원 입력자명
          latest_created_at: target.created_at || '',
          sample_target: target,
          supplier_count: supplierCounts.get(normalizedName) || 0,
          current_stages: target.current_stage ? [target.current_stage] : []
        })
      }
    })

    return Array.from(groups.values()).sort((a, b) =>
      new Date(b.latest_created_at).getTime() - new Date(a.latest_created_at).getTime()
    )
  }, [initialTargets, supplierCounts, createdByNames])

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                품목명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                거래처 수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제조원 수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                현재 단계
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                최근 등록일자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productGroups && productGroups.length > 0 ? (
              productGroups.map((group) => (
                <tr key={group.product_name} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {group.product_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {group.account_count}개 거래처
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      group.supplier_count > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {group.supplier_count}개 제조원
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {group.current_stages.length > 0 ? group.current_stages.join(', ') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {group.created_by_names.length > 0
                        ? group.created_by_names.join(', ')
                        : group.owner_names.filter((v, i, a) => a.indexOf(v) === i).join(', ')
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDateShort(group.latest_created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedProductName(group.product_name)}
                      className="text-orange-600 hover:text-orange-900 font-medium"
                    >
                      제조원 관리
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  등록된 품목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Supplier Management Modal */}
      {selectedProductName && (
        <SupplierManagementModal
          productName={selectedProductName}
          onClose={() => setSelectedProductName(null)}
        />
      )}
    </>
  )
}
