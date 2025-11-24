-- 기존 RLS 정책 모두 삭제
drop policy if exists "Anyone can read comments" on meeting_comments;
drop policy if exists "Authenticated users can insert comments" on meeting_comments;
drop policy if exists "Users can delete their own comments" on meeting_comments;
drop policy if exists "Anyone can insert comments" on meeting_comments;
drop policy if exists "Anyone can delete comments" on meeting_comments;

-- RLS 비활성화 후 재활성화 (정책 초기화)
alter table meeting_comments disable row level security;
alter table meeting_comments enable row level security;

-- 새로운 정책 생성 (간단한 인증 시스템용)
create policy "meeting_comments_select_policy"
  on meeting_comments for select
  using (true);

create policy "meeting_comments_insert_policy"
  on meeting_comments for insert
  with check (true);

create policy "meeting_comments_delete_policy"
  on meeting_comments for delete
  using (true);

create policy "meeting_comments_update_policy"
  on meeting_comments for update
  using (true);
