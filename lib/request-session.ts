import { createClient } from "@supabase/supabase-js";

type RequestSession = { configured: boolean; userId: string | null };

export async function getRequestSession(request: Request): Promise<RequestSession> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { configured: false, userId: "local-demo" };

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) return { configured: true, userId: null };

  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { configured: true, userId: null };
  return { configured: true, userId: data.user.id };
}
