-- Create target_comments table for Pipeline card comments
-- 각 타겟(품목) 카드에 댓글을 달 수 있는 기능

-- 1. Create table
create table if not exists target_comments (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references targets(id) on delete cascade,
  user_name text not null,
  comment text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Create indexes for better query performance
create index if not exists idx_target_comments_target_id on target_comments(target_id);
create index if not exists idx_target_comments_created_at on target_comments(created_at desc);

-- 3. Add RLS (Row Level Security) policies
alter table target_comments enable row level security;

-- Allow anyone to read comments (for authenticated users)
create policy "Anyone can read comments"
  on target_comments
  for select
  using (true);

-- Allow anyone to insert comments (for authenticated users)
create policy "Anyone can insert comments"
  on target_comments
  for insert
  with check (true);

-- Allow users to update their own comments (optional, for future edit feature)
create policy "Users can update their own comments"
  on target_comments
  for update
  using (true);

-- Allow users to delete their own comments (optional, for future delete feature)
create policy "Users can delete their own comments"
  on target_comments
  for delete
  using (true);

-- 4. Add comment to describe the table
comment on table target_comments is 'Comments for target pipeline cards';
comment on column target_comments.id is 'Unique identifier for the comment';
comment on column target_comments.target_id is 'Reference to the target (품목) card';
comment on column target_comments.user_name is 'Name of the user who wrote the comment';
comment on column target_comments.comment is 'Comment content';
comment on column target_comments.created_at is 'Timestamp when the comment was created';
comment on column target_comments.updated_at is 'Timestamp when the comment was last updated';
