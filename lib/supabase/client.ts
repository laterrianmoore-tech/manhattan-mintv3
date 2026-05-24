import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Browser-side client — uses the publishable (anon) key
// Safe to expose to the client; Supabase RLS policies enforce access control
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
