import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Server-side client — uses the secret key
// NEVER import this file from client components or expose the secret key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
