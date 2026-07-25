/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Graceful fallback to prevent app crash if credentials are missing
const createChainableMock = (resolvedValue: any = { data: null, error: null }): any => {
  const targetFn = () => {};
  
  const mock: any = new Proxy(targetFn, {
    get(target, prop) {
      if (prop === "then") {
        return (resolve: any) => resolve(resolvedValue);
      }
      if (prop === "catch") {
        return (reject: any) => mock;
      }
      if (prop === "finally") {
        return (callback: any) => {
          callback();
          return mock;
        };
      }
      
      if (prop === "auth") {
        return {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          signInWithPassword: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
          signOut: () => Promise.resolve({ error: null }),
        };
      }

      if (prop === "storage") {
        return {
          createBucket: () => Promise.resolve({ error: null }),
          from: () => ({
            upload: () => Promise.resolve({ data: null, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: "" } }),
          }),
        };
      }

      // Return a function that when called returns the mock itself (for chaining)
      return () => mock;
    },
    apply(target, thisArg, argArray) {
      return mock;
    }
  });
  
  return mock;
};

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
  : createChainableMock({ data: null, error: { message: "Supabase not configured", code: "NOT_CONFIGURED" } });


