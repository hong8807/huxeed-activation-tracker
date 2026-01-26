'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// v2.14: React Query 설정
// - staleTime: 30초 (데이터가 30초 동안 fresh로 유지)
// - gcTime: 5분 (사용하지 않는 캐시는 5분 후 삭제)
// - refetchOnWindowFocus: true (윈도우 포커스 시 자동 리프레시)

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30초
            gcTime: 5 * 60 * 1000, // 5분
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
