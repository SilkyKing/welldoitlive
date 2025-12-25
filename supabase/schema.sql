-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. FEEDS (The input streams)
create table feeds (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  type text not null, -- 'twitter', 'rss', 'api'
  config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table feeds enable row level security;

create policy "Users can view their own feeds"
  on feeds for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own feeds"
  on feeds for insert
  with check ( auth.uid() = user_id );

-- 2. ITEMS (The raw content)
-- Items are distinct from checks. They are the raw data ingested.
create table items (
  id uuid default uuid_generate_v4() primary key,
  feed_id uuid references feeds(id) on delete cascade not null,
  external_id text, -- unique ID from source
  content text,
  metadata jsonb default '{}'::jsonb, -- e.g. author_handle, timestamp
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table items enable row level security;

create policy "Users can view items from their feeds"
  on items for select
  using (
    exists (
      select 1 from feeds
      where feeds.id = items.feed_id
      and feeds.user_id = auth.uid()
    )
  );

-- 3. THE BANK (The Stage)
-- Shared table or User specific? Spec says "You + Co-host".
-- If shared, we need a policy for "all authenticated users" or specific team.
-- For now, let's assume personal banks, but easily switchable to shared.
create table the_bank (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  item_id uuid references items(id),
  note text, -- Manual notes
  ai_analysis jsonb, -- Stored AI responses
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table the_bank enable row level security;

create policy "Users can view their own bank"
  on the_bank for select
  using ( auth.uid() = user_id );

create policy "Users can insert into their own bank"
  on the_bank for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own bank items"
  on the_bank for update
  using ( auth.uid() = user_id );

create policy "Users can delete from their own bank"
  on the_bank for delete
  using ( auth.uid() = user_id );

-- Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table the_bank;
