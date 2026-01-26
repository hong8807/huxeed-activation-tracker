import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// v2.14: React Query를 활용한 회의록 데이터 관리 훅
// - 자동 캐싱 및 백그라운드 리프레시
// - 낙관적 업데이트 지원
// - 에러 처리 및 재시도 로직

export interface MeetingItem {
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

export interface MeetingComment {
  id: string
  meeting_item_id: string
  user_name: string
  comment_text: string
  created_at: string
  updated_at: string
}

// v2.14: 페이지네이션 응답 타입
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
  hasPrev: boolean
}

export interface MeetingsResponse {
  data: MeetingItem[]
  pagination: PaginationInfo
}

// 회의록 목록 조회 훅 (페이지네이션 지원)
export function useMeetings(options?: { page?: number; limit?: number }) {
  const { page = 1, limit = 100 } = options || {}

  return useQuery<MeetingsResponse>({
    queryKey: ['meetings', { page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      })
      const response = await fetch(`/api/meetings?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch meetings')
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30초 동안 fresh
  })
}

// v2.14: 모든 회의록 조회 (기존 호환성 유지)
export function useAllMeetings() {
  return useQuery<MeetingItem[]>({
    queryKey: ['meetings', 'all'],
    queryFn: async () => {
      // 큰 limit으로 모든 데이터 조회 (페이지네이션 없이)
      const response = await fetch('/api/meetings?limit=1000')
      if (!response.ok) {
        throw new Error('Failed to fetch meetings')
      }
      const data = await response.json()
      return data.data || []
    },
    staleTime: 30 * 1000,
  })
}

// 댓글 개수 배치 조회 훅
export function useCommentCounts(meetingItemIds: string[]) {
  return useQuery<Record<number, number>>({
    queryKey: ['commentCounts', meetingItemIds],
    queryFn: async () => {
      if (meetingItemIds.length === 0) return {}

      const response = await fetch('/api/meetings/comments/batch-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_item_ids: meetingItemIds })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch comment counts')
      }

      const data = await response.json()
      // string key를 number key로 변환
      const counts: Record<number, number> = {}
      for (const [key, value] of Object.entries(data.counts)) {
        counts[Number(key)] = value as number
      }
      return counts
    },
    enabled: meetingItemIds.length > 0,
    staleTime: 60 * 1000, // 1분 동안 fresh
  })
}

// 회의록 수정 훅 (낙관적 업데이트)
export function useUpdateMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MeetingItem> }) => {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update meeting')
      }

      return response.json()
    },
    onMutate: async ({ id, data }) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['meetings'] })

      // v2.14: 캐시된 모든 meetings 쿼리에 낙관적 업데이트 적용
      queryClient.setQueriesData<MeetingsResponse>(
        { queryKey: ['meetings'] },
        (old) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.map((meeting) =>
              meeting.id === id ? { ...meeting, ...data, updated_at: new Date().toISOString() } : meeting
            )
          }
        }
      )
    },
    onSettled: () => {
      // 서버 데이터와 동기화
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
  })
}

// 회의록 삭제 훅
export function useDeleteMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete meeting')
      }

      return response.json()
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['meetings'] })

      // v2.14: 캐시된 모든 meetings 쿼리에 낙관적 삭제 적용
      queryClient.setQueriesData<MeetingsResponse>(
        { queryKey: ['meetings'] },
        (old) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.filter((meeting) => meeting.id !== id),
            pagination: old.pagination ? {
              ...old.pagination,
              total: Math.max(0, old.pagination.total - 1)
            } : old.pagination
          }
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
  })
}

// 완료 상태 토글 훅 (is_done)
export function useToggleMeetingDone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_done }: { id: number; is_done: boolean }) => {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_done })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle meeting done status')
      }

      return response.json()
    },
    onMutate: async ({ id, is_done }) => {
      await queryClient.cancelQueries({ queryKey: ['meetings'] })

      // v2.14: 캐시된 모든 meetings 쿼리에 낙관적 업데이트 적용
      queryClient.setQueriesData<MeetingsResponse>(
        { queryKey: ['meetings'] },
        (old) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.map((meeting) =>
              meeting.id === id ? { ...meeting, is_done, updated_at: new Date().toISOString() } : meeting
            )
          }
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
  })
}

// 세션 정보 조회 훅
export function useSession() {
  return useQuery<{ can_download_meetings: boolean }>({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/session')
      if (!response.ok) {
        return { can_download_meetings: false }
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5분 동안 fresh
  })
}
