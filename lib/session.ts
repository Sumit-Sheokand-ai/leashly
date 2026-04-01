import { createSupabaseServerClient } from "./supabase/server";
import { createSupabaseAdmin } from "./supabase/admin";

export async function getSessionUser(): Promise<{ id: string; email: string } | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  // Ensure User row exists in public schema (FK guard)
  // This handles cases where the trigger didn't fire (e.g. OAuth, manual creation)
  try {
    const db = createSupabaseAdmin();
    await db.from("User").upsert(
      { id: user.id, email: user.email, plan: "free" },
      { onConflict: "id", ignoreDuplicates: true }
    );
  } catch {
    // Non-blocking — don't fail auth if upsert errors
  }

  return { id: user.id, email: user.email };
}
