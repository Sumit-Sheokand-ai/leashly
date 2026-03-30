import { createSupabaseServerClient } from "./supabase/server";

export async function getSessionUser(): Promise<{ id: string; email: string } | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return { id: user.id, email: user.email };
}
