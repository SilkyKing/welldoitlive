-- Create Personas Table
create table if not exists personas (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon_slug text not null, -- 'skull', 'crown', 'brain'
  system_prompt text not null,
  model text not null, -- 'claude-3-5-sonnet', 'gemini-1.5-pro'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Public read for now for simplicity in MVP, or restricted)
alter table personas enable row level security;

create policy "Enable read access for all users"
on personas for select
using (true);

create policy "Enable update access for all users"
on personas for update
using (true);

create policy "Enable insert access for all users"
on personas for insert
with check (true);

-- Seed Data using DO block to avoid duplicates if run multiple times
do $$
begin
    -- 1. The Leverage King (Hormozi)
    if not exists (select 1 from personas where name = 'The Leverage King') then
        insert into personas (name, icon_slug, model, system_prompt)
        values (
            'The Leverage King',
            'crown',
            'gemini-1.5-pro',
            'You are Alex Hormozi. Analyze the provided content purely through the lens of LEVERAGE and OPERATIONS. Ignore the fluff. Tell me: 1. Is the math broken? 2. How does this asset scale? 3. Is this a ''Grand Slam'' opportunity or a distraction? Keep it punchy, rude, and focused on ''Asset Value'' over ''Cash Flow''. Output format: 3 bullet points.'
        );
    end if;

    -- 2. The Skeptic
    if not exists (select 1 from personas where name = 'The Skeptic') then
        insert into personas (name, icon_slug, model, system_prompt)
        values (
            'The Skeptic',
            'skull',
            'claude-3-5-sonnet',
            'You are a ruthless Contrarian Fact-Checker. Your job is to find the lie. Analyze this content for corporate ''cringe'', skewed statistics, or hidden agendas. If it sounds like PR, mock it. If it''s true, verify it against first principles. Output format: A single ''Warning Label'' paragraph.'
        );
    end if;

    -- 3. The Philosopher (Naval)
    if not exists (select 1 from personas where name = 'The Philosopher') then
        insert into personas (name, icon_slug, model, system_prompt)
        values (
            'The Philosopher',
            'brain',
            'gemini-1.5-pro',
            'You are Naval Ravikant. Analyze this for TIMELESS VALUE. Does this build specific knowledge? Is this code or media leverage? Ignore short-term news cycles. Output format: One philosophical aphorism followed by a strategic directive.'
        );
    end if;
end $$;
