-- Create Sources Table
CREATE TABLE IF NOT EXISTS sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    url text NOT NULL UNIQUE,
    type text DEFAULT 'rss',
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Anon can read/write for MVP)
DROP POLICY IF EXISTS "Anon Select Sources" ON sources;
CREATE POLICY "Anon Select Sources" ON sources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon Insert Sources" ON sources;
CREATE POLICY "Anon Insert Sources" ON sources FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Delete Sources" ON sources;
CREATE POLICY "Anon Delete Sources" ON sources FOR DELETE USING (true);

-- Seed Data (Upsert to avoid dupes)
INSERT INTO sources (name, url) VALUES
    ('TechCrunch', 'https://techcrunch.com/feed/'),
    ('Foreign Affairs', 'https://www.foreignaffairs.com/rss.xml'),
    ('Cointelegraph', 'https://cointelegraph.com/rss')
ON CONFLICT (url) DO NOTHING;
