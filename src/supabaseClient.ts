import { createClient } from "@supabase/supabase-js";

// ====== SUPABASE CONFIGURATION / የሱፓቤዝ ማዋቀሪያ ======
// እባክዎን እነዚህን ተለዋዋጮች በእርስዎ ትክክለኛ የ Supabase ፕሮጀክት መረጃዎች ይቀይሩዋቸው / Please replace these with your actual Supabase project credentials

// ማሳሰቢያ፡ ሱፓቤዝ ህግ መሰረት የ API URL አስከ ፕሮጀክቱ ስም ብቻ ነው መሆን ያለበት (ያለ "/rest/v1")።
// Note: The URL must be the base URL without "/rest/v1" suffix, because the Supabase SDK automatically appends it.
const SUPABASE_URL = "https://rjdvctisvyrcfbwlfcnq.supabase.co"; 
const SUPABASE_PUBLIC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqZHZjdGlzdnlyY2Zid2xmY25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMjY2MTEsImV4cCI6MjA5NzYwMjYxMX0.LmdbSH8U4lETjDQOCv_yPzBUNYvX9o9bcC_Iqa-RNZY";

// Create and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
