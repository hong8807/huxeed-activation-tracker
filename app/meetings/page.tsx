'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusIcon, FunnelIcon, CheckIcon, XMarkIcon, ArrowDownTrayIcon, CalendarIcon, MagnifyingGlassIcon, PrinterIcon } from '@heroicons/react/24/outline'

interface MeetingItem {
  id: number
  meeting_type: string
  meeting_date: string
  account_name: string | null
  content: string
  assignee_name: string | null
  reply_text: string | null
  is_done: boolean
  is_record: boolean
  created_at: string
  updated_at: string
}

const MEETING_TYPES = ['일간회의', '월간회의', '분기회의', '년마감회의']

const MEETING_TYPE_COLORS: Record<string, string> = {
  '일간회의': 'bg-blue-100 text-blue-800 border-blue-200',
  '월간회의': 'bg-purple-100 text-purple-800 border-purple-200',
  '분기회의': 'bg-orange-100 text-orange-800 border-orange-200',
  '년마감회의': 'bg-red-100 text-red-800 border-red-200',
}

export default function MeetingsPage() {
  const [items, setItems] = useState<MeetingItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MeetingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(true)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all')
  const [uniqueAssignees, setUniqueAssignees] = useState<string[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<{
    meeting_type: string
    meeting_date: string
    account_name: string
    content: string
    assignee_name: string
    reply_text: string
  }>({
    meeting_type: '',
    meeting_date: '',
    account_name: '',
    content: '',
    assignee_name: '',
    reply_text: ''
  })
  const [canDownload, setCanDownload] = useState<boolean>(false)
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false)
  const [showAllPrintModal, setShowAllPrintModal] = useState<boolean>(false)

  // 데이터 로드
  useEffect(() => {
    fetchItems()
    checkDownloadPermission()
  }, [])

  // 다운로드 권한 확인
  const checkDownloadPermission = async () => {
    try {
      console.log('🔍 Checking download permission...')
      const response = await fetch('/api/auth/session')
      console.log('📡 Session API response:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('📊 Session data:', data)
        console.log('✅ Can download meetings:', data.can_download_meetings)
        setCanDownload(data.can_download_meetings || false)
      } else {
        console.error('❌ Session check failed:', response.status)
        setCanDownload(false)
      }
    } catch (error) {
      console.error('❌ Failed to check download permission:', error)
      setCanDownload(false)
    }
  }

  // 필터링
  useEffect(() => {
    let filtered = items

    // 회의 타입 필터
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.meeting_type === selectedType)
    }

    // 완료 여부 필터
    if (!showCompleted) {
      filtered = filtered.filter(item => !item.is_done)
    }

    // 날짜 필터 (한국 시간대 고려)
    const getKSTDate = (date: Date) => {
      const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)) // UTC+9 (한국 시간)
      return kstDate.toISOString().split('T')[0]
    }

    const today = new Date()
    const todayStr = getKSTDate(today)

    if (dateFilter === 'today') {
      filtered = filtered.filter(item => item.meeting_date === todayStr)
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoStr = getKSTDate(weekAgo)
      filtered = filtered.filter(item => item.meeting_date >= weekAgoStr)
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const monthAgoStr = getKSTDate(monthAgo)
      filtered = filtered.filter(item => item.meeting_date >= monthAgoStr)
    }

    // 사용자 정의 날짜 필터
    if (customStartDate) {
      filtered = filtered.filter(item => item.meeting_date >= customStartDate)
    }
    if (customEndDate) {
      filtered = filtered.filter(item => item.meeting_date <= customEndDate)
    }

    // 담당자 필터
    if (selectedAssignee !== 'all') {
      filtered = filtered.filter(item => item.assignee_name === selectedAssignee)
    }

    // 검색 필터 (모든 필드에서 검색)
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim()
      filtered = filtered.filter(item => {
        return (
          item.meeting_type.toLowerCase().includes(keyword) ||
          item.meeting_date.includes(keyword) ||
          (item.account_name && item.account_name.toLowerCase().includes(keyword)) ||
          item.content.toLowerCase().includes(keyword) ||
          (item.assignee_name && item.assignee_name.toLowerCase().includes(keyword)) ||
          (item.reply_text && item.reply_text.toLowerCase().includes(keyword))
        )
      })
    }

    // 정렬 로직
    // 1순위: 최신 날짜가 위로 (meeting_date 내림차순)
    // 2순위: 단순기록 아닌 항목이 위로 (is_record: false가 위로)
    // 3순위: 완료되지 않은 항목이 위로 (is_done: false가 위로)
    filtered.sort((a, b) => {
      // 1순위: 날짜 비교 (최신이 위로)
      const dateCompare = new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
      if (dateCompare !== 0) return dateCompare

      // 2순위: 단순기록 여부 (false가 위로)
      if (a.is_record !== b.is_record) {
        return a.is_record ? 1 : -1
      }

      // 3순위: 완료 여부 (false가 위로)
      if (a.is_done !== b.is_done) {
        return a.is_done ? 1 : -1
      }

      return 0
    })

    setFilteredItems(filtered)
  }, [items, selectedType, showCompleted, dateFilter, customStartDate, customEndDate, searchKeyword, selectedAssignee])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/meetings')
      const data = await response.json()
      setItems(data.data || [])

      // 고유 담당자 목록 추출
      const assignees = data.data
        .map((item: MeetingItem) => item.assignee_name)
        .filter((name: string | null) => name && name.trim())
        .filter((name: string, index: number, self: string[]) => self.indexOf(name) === index)
        .sort()

      setUniqueAssignees(assignees)
    } catch (error) {
      console.error('Failed to fetch meeting items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: MeetingItem) => {
    setEditingId(item.id)
    setEditData({
      meeting_type: item.meeting_type,
      meeting_date: item.meeting_date,
      account_name: item.account_name || '',
      content: item.content,
      assignee_name: item.assignee_name || '',
      reply_text: item.reply_text || ''
    })
  }

  const handleSave = async (id: number) => {
    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        await fetchItems()
        setEditingId(null)
      } else {
        alert('저장에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('저장 중 오류가 발생했습니다')
    }
  }

  const handleToggleDone = async (item: MeetingItem) => {
    try {
      const response = await fetch(`/api/meetings/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_done: !item.is_done })
      })

      if (response.ok) {
        await fetchItems()
      }
    } catch (error) {
      console.error('Failed to toggle done:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchItems()
      } else {
        alert('삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('삭제 중 오류가 발생했습니다')
    }
  }

  // 검색어 하이라이트 함수
  const highlightKeyword = (text: string | null) => {
    if (!text || !searchKeyword.trim()) return text

    const keyword = searchKeyword.trim()
    const regex = new RegExp(`(${keyword})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const handleExportExcel = async () => {
    try {
      // 현재 필터 조건으로 쿼리 파라미터 생성
      const params = new URLSearchParams()

      if (selectedType !== 'all') {
        params.append('meeting_type', selectedType)
      }

      if (!showCompleted) {
        params.append('is_done', 'false')
      }

      // 날짜 필터 처리 (한국 시간대 고려)
      const getKSTDate = (date: Date) => {
        const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)) // UTC+9
        return kstDate.toISOString().split('T')[0]
      }

      const today = new Date()

      if (dateFilter === 'today') {
        const todayStr = getKSTDate(today)
        params.append('start_date', todayStr)
        params.append('end_date', todayStr)
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        params.append('start_date', getKSTDate(weekAgo))
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        params.append('start_date', getKSTDate(monthAgo))
      }

      // 사용자 정의 날짜
      if (customStartDate) {
        params.append('start_date', customStartDate)
      }
      if (customEndDate) {
        params.append('end_date', customEndDate)
      }

      // 다운로드
      const url = `/api/meetings/export?${params.toString()}`
      window.open(url, '_blank')
    } catch (error) {
      console.error('Export error:', error)
      alert('엑셀 다운로드 중 오류가 발생했습니다')
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e5dc]">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">회의 실행 항목 관리</h1>
              <p className="mt-1 text-sm text-gray-600">
                회의에서 나온 실행 항목을 관리하고 진척도를 추적하세요
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAllPrintModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-semibold"
              >
                <PrinterIcon className="w-5 h-5" />
                전체 출력
              </button>
              {canDownload && (
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#95c11f] text-[#95c11f] rounded-md hover:bg-[#95c11f]/10 transition-colors font-semibold"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  엑셀 다운로드
                </button>
              )}
              <Link
                href="/meetings/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#95c11f] text-white rounded-md hover:bg-[#7aa619] transition-colors font-semibold"
              >
                <PlusIcon className="w-5 h-5" />
                엑셀 업로드
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="bg-white rounded-xl border border-[#e2e5dc] p-4 space-y-4">
          {/* 검색창 */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="회의제목, 일시, 거래처명, 내용, 담당자명, 답변 등 검색..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#95c11f] focus:border-transparent"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 첫 번째 행: 회의 타입 & 담당자 & 완료 항목 */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">회의 타입:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#95c11f]"
              >
                <option value="all">전체 회의</option>
                {MEETING_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <span className="text-sm font-semibold text-gray-700 ml-4">담당자:</span>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#95c11f]"
              >
                <option value="all">전체 담당자</option>
                {uniqueAssignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>

              {selectedAssignee !== 'all' && (
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-semibold"
                >
                  <PrinterIcon className="w-4 h-4" />
                  노트 출력
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="w-4 h-4 text-[#95c11f] border-gray-300 rounded focus:ring-[#95c11f]"
              />
              <span className="text-sm text-gray-700">완료된 항목 표시</span>
            </label>
          </div>

          {/* 두 번째 행: 날짜 필터 */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">기간:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setDateFilter('all')
                  setShowCustomDate(false)
                  setCustomStartDate('')
                  setCustomEndDate('')
                }}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors font-semibold ${
                  dateFilter === 'all' && !showCustomDate
                    ? 'bg-[#95c11f] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => {
                  setDateFilter('today')
                  setShowCustomDate(false)
                  setCustomStartDate('')
                  setCustomEndDate('')
                }}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors font-semibold ${
                  dateFilter === 'today'
                    ? 'bg-[#95c11f] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                오늘
              </button>
              <button
                onClick={() => {
                  setDateFilter('week')
                  setShowCustomDate(false)
                  setCustomStartDate('')
                  setCustomEndDate('')
                }}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors font-semibold ${
                  dateFilter === 'week'
                    ? 'bg-[#95c11f] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                최근 7일
              </button>
              <button
                onClick={() => {
                  setDateFilter('month')
                  setShowCustomDate(false)
                  setCustomStartDate('')
                  setCustomEndDate('')
                }}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors font-semibold ${
                  dateFilter === 'month'
                    ? 'bg-[#95c11f] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                최근 30일
              </button>
              <button
                onClick={() => {
                  setDateFilter('all')
                  setShowCustomDate(true)
                }}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors font-semibold ${
                  showCustomDate
                    ? 'bg-[#95c11f] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                기간 선택
              </button>
            </div>
          </div>

          {/* 사용자 정의 날짜 선택 */}
          {showCustomDate && (
            <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700 ml-8">날짜 범위:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#95c11f]"
              />
              <span className="text-sm text-gray-500">~</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#95c11f]"
              />
            </div>
          )}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded-r-lg flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-blue-800">
            <strong>안내:</strong> 특정인이 아닌 다같이 확인이 필요한 내용은 부서명으로 기재
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 pb-8">
        {/* 검색 결과 표시 */}
        {!loading && searchKeyword && (
          <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>"{searchKeyword}"</strong> 검색 결과: <strong>{filteredItems.length}건</strong>
              {filteredItems.length > 0 && ` (전체 ${items.length}건 중)`}
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#95c11f] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-600">데이터 로딩 중...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e2e5dc] p-12 text-center">
            {searchKeyword ? (
              <>
                <p className="text-gray-500">검색 결과가 없습니다</p>
                <button
                  onClick={() => setSearchKeyword('')}
                  className="inline-block mt-4 text-[#95c11f] hover:text-[#7aa619] font-semibold"
                >
                  검색어 지우기 →
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500">표시할 회의 항목이 없습니다</p>
                <Link
                  href="/meetings/upload"
                  className="inline-block mt-4 text-[#95c11f] hover:text-[#7aa619] font-semibold"
                >
                  엑셀 파일 업로드하기 →
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg border ${
                  item.is_done ? 'border-green-200 bg-green-50/30' : 'border-[#e2e5dc]'
                } p-5 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleDone(item)}
                    className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      item.is_done
                        ? 'bg-[#95c11f] border-[#95c11f]'
                        : 'border-gray-300 hover:border-[#95c11f]'
                    }`}
                  >
                    {item.is_done && <CheckIcon className="w-4 h-4 text-white" />}
                  </button>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${MEETING_TYPE_COLORS[item.meeting_type]}`}>
                        {highlightKeyword(item.meeting_type)}
                      </span>
                      {item.is_record && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                          📋 단순 기록
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {highlightKeyword(new Date(item.meeting_date).toLocaleDateString('ko-KR'))}
                      </span>
                      {item.account_name && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                          {highlightKeyword(item.account_name)}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <p className={`text-gray-900 mb-3 ${item.is_done ? 'line-through text-gray-500' : ''}`}>
                      {highlightKeyword(item.content)}
                    </p>

                    {/* Editable Fields */}
                    {editingId === item.id ? (
                      <div className="space-y-3 bg-gray-50 p-4 rounded-md border border-gray-200">
                        {/* 회의록 작성 내용 편집 */}
                        <div className="pb-3 border-b border-gray-300">
                          <p className="text-xs font-semibold text-gray-600 mb-3">📝 회의록 작성 내용</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">회의제목</label>
                              <select
                                value={editData.meeting_type}
                                onChange={(e) => setEditData({ ...editData, meeting_type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#95c11f] text-sm"
                              >
                                {MEETING_TYPES.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">일시</label>
                              <input
                                type="date"
                                value={editData.meeting_date}
                                onChange={(e) => setEditData({ ...editData, meeting_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#95c11f] text-sm"
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">거래처명</label>
                            <input
                              type="text"
                              value={editData.account_name}
                              onChange={(e) => setEditData({ ...editData, account_name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#95c11f] text-sm"
                              placeholder="거래처명을 입력하세요 (선택사항)"
                            />
                          </div>
                          <div className="mt-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">내용</label>
                            <textarea
                              value={editData.content}
                              onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#95c11f] text-sm resize-none"
                              placeholder="회의 실행 항목 내용을 입력하세요"
                            />
                          </div>
                        </div>
                        {/* 담당자 답변 편집 */}
                        <div className="pt-3">
                          <p className="text-xs font-semibold text-gray-600 mb-3">👤 담당자 답변</p>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">담당자명</label>
                            <input
                              type="text"
                              value={editData.assignee_name}
                              onChange={(e) => setEditData({ ...editData, assignee_name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#95c11f] text-sm"
                              placeholder="담당자명을 입력하세요"
                            />
                          </div>
                          <div className="mt-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">관련 내용 답변</label>
                            <textarea
                              value={editData.reply_text}
                              onChange={(e) => setEditData({ ...editData, reply_text: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#95c11f] text-sm resize-none"
                              placeholder="진행 상황이나 관련 내용을 입력하세요"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-gray-300">
                          <button
                            onClick={() => handleSave(item.id)}
                            className="px-4 py-2 bg-[#95c11f] text-white rounded-md hover:bg-[#7aa619] text-sm font-semibold"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-semibold"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : !item.is_record ? (
                      <div className="space-y-2">
                        {item.assignee_name && (
                          <div className="text-sm">
                            <span className="font-semibold text-gray-700">담당자:</span>{' '}
                            <span className="text-gray-900">{highlightKeyword(item.assignee_name)}</span>
                          </div>
                        )}
                        {item.reply_text && (
                          <div className="text-sm">
                            <span className="font-semibold text-gray-700">답변:</span>{' '}
                            <span className="text-gray-900">{highlightKeyword(item.reply_text)}</span>
                          </div>
                        )}
                        {!item.assignee_name && !item.reply_text && (
                          <p className="text-sm text-gray-400 italic">담당자 및 답변이 아직 입력되지 않았습니다</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 italic">
                          📋 이 항목은 단순 기록입니다 (담당자/답변 불필요)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-2">
                    {editingId !== item.id && (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-3 py-1.5 text-sm text-[#95c11f] hover:bg-[#95c11f]/10 rounded-md font-semibold transition-colors"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md font-semibold transition-colors"
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer - Updated At */}
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  최종 수정: {new Date(item.updated_at).toLocaleString('ko-KR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 프린트 모달 */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedAssignee}님의 회의 실행 항목
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#95c11f] text-white rounded-md hover:bg-[#7aa619] transition-colors font-semibold"
                  >
                    <PrinterIcon className="w-5 h-5" />
                    출력
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-semibold"
                  >
                    닫기
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <p>
                  실행 필요 항목: <strong className="text-[#95c11f]">{filteredItems.filter(item => !item.is_done).length}개</strong>
                </p>
                <p className="text-xs text-gray-500">
                  💡 완료된 항목은 제외됩니다
                </p>
              </div>
            </div>

            {/* 프린트 영역 */}
            <div id="print-content" className="p-6">
              <div className="print-header mb-6 pb-4 border-b-2 border-gray-800">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">회의 실행 항목</h1>
                <div className="flex items-center justify-between">
                  <p className="text-base text-gray-600">담당자: <strong>{selectedAssignee}</strong></p>
                  <p className="text-sm text-gray-500">
                    출력일: {new Date().toLocaleDateString('ko-KR')} | 총 {filteredItems.filter(item => !item.is_done).length}개 항목
                  </p>
                </div>
              </div>

              {/* 리스트 형태 (완료 항목 제외) */}
              <div className="space-y-3">
                {filteredItems.filter(item => !item.is_done).length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-2">🎉 모든 항목이 완료되었습니다!</p>
                    <p className="text-sm text-gray-400">실행이 필요한 항목이 없습니다.</p>
                  </div>
                ) : (
                  filteredItems
                    .filter(item => !item.is_done)
                    .map((item, index) => (
                  <div
                    key={item.id}
                    className="list-item border-l-4 border-[#95c11f] bg-gray-50 px-4 py-3 break-inside-avoid"
                  >
                    {/* 한 줄 헤더 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">
                          {index + 1}.
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${MEETING_TYPE_COLORS[item.meeting_type]}`}>
                          {item.meeting_type}
                        </span>
                        {item.account_name && (
                          <span className="text-sm text-gray-700">
                            | <strong>{item.account_name}</strong>
                          </span>
                        )}
                        {item.is_done && (
                          <span className="text-xs text-green-600 font-semibold">
                            ✓ 완료
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(item.meeting_date).toLocaleDateString('ko-KR')}
                      </span>
                    </div>

                    {/* 내용 한 줄 */}
                    <div className="text-sm text-gray-900 mb-1">
                      <strong className="text-gray-700">▪</strong> {item.content}
                    </div>

                    {/* 답변 (있는 경우만) */}
                    {item.reply_text && (
                      <div className="text-xs text-gray-600 ml-3">
                        <strong>답변:</strong> {item.reply_text}
                      </div>
                    )}

                    {/* 완료 체크박스 (미완료 항목만) */}
                    {!item.is_done && (
                      <div className="mt-2 ml-3">
                        <label className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 border border-gray-400 rounded"
                            disabled
                          />
                          완료
                        </label>
                      </div>
                    )}
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 전체 출력 모달 */}
      {showAllPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  회의 실행 항목 전체 출력
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#95c11f] text-white rounded-md hover:bg-[#7aa619] transition-colors font-semibold"
                  >
                    <PrinterIcon className="w-5 h-5" />
                    출력
                  </button>
                  <button
                    onClick={() => setShowAllPrintModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-semibold"
                  >
                    닫기
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <p>
                    총 항목: <strong className="text-gray-900">{filteredItems.length}개</strong>
                  </p>
                  <p>
                    실행 필요: <strong className="text-[#95c11f]">{filteredItems.filter(item => !item.is_done).length}개</strong>
                  </p>
                  <p>
                    완료: <strong className="text-green-600">{filteredItems.filter(item => item.is_done).length}개</strong>
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  💡 현재 적용된 필터 조건에 맞는 항목만 출력됩니다
                </p>
              </div>
            </div>

            {/* 프린트 영역 */}
            <div id="print-content-all" className="p-6">
              <div className="print-header mb-6 pb-4 border-b-2 border-gray-800">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">회의 실행 항목</h1>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      {selectedType !== 'all' && <span>회의: <strong>{selectedType}</strong> | </span>}
                      {selectedAssignee !== 'all' && <span>담당자: <strong>{selectedAssignee}</strong> | </span>}
                      {dateFilter !== 'all' && <span>기간: <strong>{dateFilter === 'today' ? '오늘' : dateFilter === 'week' ? '최근 7일' : dateFilter === 'month' ? '최근 30일' : '사용자 정의'}</strong> | </span>}
                      {searchKeyword && <span>검색: <strong>"{searchKeyword}"</strong> | </span>}
                      총 <strong>{filteredItems.length}개</strong> 항목
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    출력일: {new Date().toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>

              {/* 리스트 형태 */}
              <div className="space-y-3">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-2">표시할 항목이 없습니다</p>
                    <p className="text-sm text-gray-400">필터 조건을 변경해주세요</p>
                  </div>
                ) : (
                  filteredItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`list-item border-l-4 ${
                        item.is_done ? 'border-green-500 bg-green-50' : 'border-[#95c11f] bg-gray-50'
                      } px-4 py-3 break-inside-avoid`}
                    >
                      {/* 한 줄 헤더 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-base">
                            {index + 1}.
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${MEETING_TYPE_COLORS[item.meeting_type]}`}>
                            {item.meeting_type}
                          </span>
                          {item.is_record && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                              📋 기록
                            </span>
                          )}
                          {item.account_name && (
                            <span className="text-sm text-gray-700">
                              | <strong>{item.account_name}</strong>
                            </span>
                          )}
                          {item.is_done && (
                            <span className="text-xs text-green-600 font-semibold">
                              ✓ 완료
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(item.meeting_date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>

                      {/* 내용 */}
                      <div className={`text-sm mb-1 ${item.is_done ? 'text-gray-600' : 'text-gray-900'}`}>
                        <strong className="text-gray-700">▪</strong> {item.content}
                      </div>

                      {/* 담당자 및 답변 (단순기록 아닌 경우만) */}
                      {!item.is_record && (
                        <>
                          {item.assignee_name && (
                            <div className="text-xs text-gray-600 ml-3">
                              <strong>담당자:</strong> {item.assignee_name}
                            </div>
                          )}
                          {item.reply_text && (
                            <div className="text-xs text-gray-600 ml-3">
                              <strong>답변:</strong> {item.reply_text}
                            </div>
                          )}
                        </>
                      )}

                      {/* 완료 체크박스 (미완료 항목만) */}
                      {!item.is_done && (
                        <div className="mt-2 ml-3">
                          <label className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 border border-gray-400 rounded"
                              disabled
                            />
                            완료
                          </label>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 프린트 스타일 */}
      <style jsx global>{`
        @media print {
          /* 페이지 설정 */
          @page {
            size: A4;
            margin: 15mm;
          }

          /* 모든 요소 숨기기 */
          body * {
            visibility: hidden !important;
          }

          /* 프린트 영역만 표시 */
          #print-content,
          #print-content *,
          #print-content-all,
          #print-content-all * {
            visibility: visible !important;
          }

          /* 프린트 영역 위치 - static으로 변경하여 자연스러운 페이지 흐름 */
          #print-content,
          #print-content-all {
            position: static !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* 프린트 헤더 */
          .print-header {
            page-break-after: avoid;
            margin-bottom: 10mm;
          }

          /* 리스트 항목들 */
          .space-y-3 {
            display: block !important;
          }

          .list-item {
            margin-bottom: 4mm;
            /* 회색 배경 제거 */
            background: white !important;
            border-left: 4px solid #95c11f !important;
          }

          /* 회색 배경 모두 제거 */
          .bg-gray-50,
          .bg-green-50 {
            background: white !important;
          }

          /* 배경색 출력 */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}
