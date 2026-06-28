import { createClient } from "@supabase/supabase-js";

// ==========================================
// SUPABASE CONFIGURATION / የሱፓቤዝ ማዋቀሪያ
// ==========================================
// እባክዎን እነዚህን ተለዋዋጮች በእርስዎ ትክክለኛ የ Supabase ፕሮጀክት መረጃዎች ይቀይሩዋቸው።
// Please replace these credentials with your actual Supabase project info:

const SUPABASE_URL = "https://rjdvctisvyrcfbwlfcnq.supabase.co";
const SUPABASE_PUBLIC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqZHZjdGlzdnlyY2Zid2xmY25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMjY2MTEsImV4cCI6MjA5NzYwMjYxMX0.LmdbSH8U4lETjDQOCv_yPzBUNYvX9o9bcC_Iqa-RNZY";

// Create and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
