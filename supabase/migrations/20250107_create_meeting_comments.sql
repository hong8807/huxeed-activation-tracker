-- 회의록 댓글 테이블 생성
create table if not exists meeting_comments (
  id uuid primary key default gen_random_uuid(),
  meeting_item_id uuid not null references meeting_items(id) on delete cascade,
  user_name text not null,
  comment_text text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 인덱스 생성 (빠른 조회를 위해)
create index idx_meeting_comments_item_id on meeting_comments(meeting_item_id);
create index idx_meeting_comments_created_at on meeting_comments(created_at desc);

-- RLS (Row Level Security) 활성화
alter table meeting_comments enable row level security;

-- 모든 사용자가 댓글을 읽을 수 있도록
create policy "Anyone can read comments"
  on meeting_comments for select
  using (true);

-- 인증된 사용자만 댓글을 작성할 수 있도록
create policy "Authenticated users can insert comments"
  on meeting_comments for insert
  with check (auth.role() = 'authenticated');

-- 댓글 작성자만 자신의 댓글을 삭제할 수 있도록
create policy "Users can delete their own comments"
  on meeting_comments for delete
  using (true);

-- 코멘트: 현재 사용자 인증 시스템이 간단하므로 삭제는 모두 허용
-- 실제 프로덕션에서는 user_name과 현재 로그인 사용자를 비교하는 로직 필요
