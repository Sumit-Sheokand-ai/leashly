import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_COOKIE_MAX_AGE } from "./config";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookieOptions: {
        maxAge: SUPABASE_COOKIE_MAX_AGE,
      },
    }
  );
}
