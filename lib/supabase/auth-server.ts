import { createClient } from '@supabase/supabase-js'

// 인증용 Supabase 클라이언트 (서비스 롤 키 사용, RLS 우회)
export function createAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
