import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are defined or use placeholders to prevent build errors before configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing. Check .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
