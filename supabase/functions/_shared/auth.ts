import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type RequestContext = {
  userId: string;
  isAdmin: boolean;
};

type Clients = {
  anonClient: ReturnType<typeof createClient>;
  serviceClient: ReturnType<typeof createClient>;
};

export function getSupabaseClients(authHeader: string | null): Clients {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader ?? "" } },
    auth: { persistSession: false },
  });

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return { anonClient, serviceClient };
}

export async function getRequestContext(authHeader: string | null): Promise<{
  ctx: RequestContext;
  serviceClient: ReturnType<typeof createClient>;
}> {
  const { anonClient, serviceClient } = getSupabaseClients(authHeader);
  const { data: userData, error: userError } = await anonClient.auth.getUser();

  if (userError || !userData.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = userData.user.id;
  const { data: profile, error: profileError } = await serviceClient
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error("Failed to resolve user profile");
  }

  return {
    ctx: {
      userId,
      isAdmin: Boolean(profile?.is_admin),
    },
    serviceClient,
  };
}

export function requireAdmin(ctx: RequestContext) {
  if (!ctx.isAdmin) {
    throw new Error("Forbidden: admin access required");
  }
}
