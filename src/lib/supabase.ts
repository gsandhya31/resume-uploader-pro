import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// NOTE: In Lovable projects, these values are usually injected at build-time.
// This wrapper adds a safe fallback to prevent a blank screen if env injection fails.
const FALLBACK_PROJECT_ID = "ivuzwrdutqrxtiqqgrlp";
const FALLBACK_URL = `https://${FALLBACK_PROJECT_ID}.supabase.co`;
const FALLBACK_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dXp3cmR1dHFyeHRpcXFncmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTg2MTcsImV4cCI6MjA4MTg3NDYxN30.6i-CPvcB753i_cxm2Oz8inLc7UWSpn1NHSH_aZFSYlc";

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const supabaseUrl = envUrl || (envProjectId ? `https://${envProjectId}.supabase.co` : FALLBACK_URL);
const supabaseKey = envKey || FALLBACK_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
