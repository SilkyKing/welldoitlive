-- FIX: Allow Anon Use of The Bank
-- Relax user_id constraint
ALTER TABLE the_bank ALTER COLUMN user_id DROP NOT NULL;

-- Enable Public Access for 'the_bank'
DROP POLICY IF EXISTS "Public Select Bank" ON the_bank;
CREATE POLICY "Public Select Bank" ON the_bank FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Bank" ON the_bank;
CREATE POLICY "Public Insert Bank" ON the_bank FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Bank" ON the_bank;
CREATE POLICY "Public Update Bank" ON the_bank FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Bank" ON the_bank;
CREATE POLICY "Public Delete Bank" ON the_bank FOR DELETE USING (true);

-- Ensure RLS is enabled
ALTER TABLE the_bank ENABLE ROW LEVEL SECURITY;
