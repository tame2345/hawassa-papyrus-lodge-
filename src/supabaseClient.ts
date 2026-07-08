/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Graceful fallback to prevent app crash if credentials are missing
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage:
          typeof window !== "undefined"
            ? window.sessionStorage
            : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : new Proxy({} as any, {
      get(target, prop) {
        console.warn(`Supabase client accessed but VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not defined. Property: ${String(prop)}`);
        
        // Return descriptive placeholders to keep the app functional
        const dummyMethods: Record<string, any> = {
          select: () => ({}),
          insert: () => ({}),
          update: () => ({}),
          upsert: () => ({ error: { message: "Supabase not configured", code: "NOT_CONFIGURED" } }),
          delete: () => ({}),
          from: () => ({
            select: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
            insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
            update: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
            upsert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
            delete: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          }),
          auth: {
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            signInWithPassword: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
            signOut: () => Promise.resolve({ error: null }),
          }
        };

        const keyStr = typeof prop === "symbol" ? "" : String(prop);
        if (keyStr && keyStr in dummyMethods) {
          return dummyMethods[keyStr];
        }

        return () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } });
      }
    });


