-- Relax User ID constraints to allow Anon/Guest usage
ALTER TABLE feeds ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE the_bank ALTER COLUMN user_id DROP NOT NULL;

-- Enable public access policies (Workaround for MVP/Demo)
-- Feeds
PROCREATE POLICY "Allow anon read feeds" ON feeds FOR SELECT USING (true);
CREATE POLICY "Allow anon insert feeds" ON feeds FOR INSERT WITH CHECK (true);

-- Items (already has no user_id, but needs RLS check)
CREATE POLICY "Allow anon read items" ON items FOR SELECT USING (true);
CREATE POLICY "Allow anon insert items" ON items FOR INSERT WITH CHECK (true);

-- The Bank
CREATE POLICY "Allow anon all the_bank" ON the_bank FOR ALL USING (true) WITH CHECK (true);
