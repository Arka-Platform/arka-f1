import { getRequestContext } from "../_shared/auth.ts";
import { handleOptions, jsonResponse } from "../_shared/http.ts";

function parsePositiveInt(input: string | null, fallback: number) {
  if (!input) return fallback;
  const parsed = Number.parseInt(input, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInt(input: string | null, fallback: number) {
  if (!input) return fallback;
  const parsed = Number.parseInt(input, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { ctx, serviceClient } = await getRequestContext(authHeader);
    const url = new URL(req.url);
    let body: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return jsonResponse(400, { error: "Invalid JSON body" });
      }
    }

    const status =
      (url.searchParams.get("status") ?? (body.status as string | undefined) ?? null)?.trim() || null;
    const orderId =
      (url.searchParams.get("order_id") ?? (body.order_id as string | undefined) ?? null)?.trim() || null;
    const limit = Math.min(
      parsePositiveInt(url.searchParams.get("limit") ?? (body.limit as string | undefined) ?? null, 50),
      200,
    );
    const offset = parseNonNegativeInt(
      url.searchParams.get("offset") ?? (body.offset as string | undefined) ?? null,
      0,
    );

    if (ctx.isAdmin) {
      let query = serviceClient
        .from("shipments")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + Math.max(limit - 1, 0));

      if (status) query = query.eq("status", status);
      if (orderId) query = query.eq("order_id", orderId);

      const { data, error } = await query;
      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, { shipments: data ?? [] });
    }

    // Non-admin access: limit to shipments for requester's own orders.
    // Fast path for common case: querying a single order_id should avoid loading all user orders.
    if (orderId) {
      const { data: ownedOrder, error: ownedOrderError } = await serviceClient
        .from("orders")
        .select("id")
        .eq("id", orderId)
        .eq("user_id", ctx.userId)
        .maybeSingle();

      if (ownedOrderError) return jsonResponse(500, { error: ownedOrderError.message });
      if (!ownedOrder) return jsonResponse(200, { shipments: [] });

      let query = serviceClient
        .from("shipments")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .range(offset, offset + Math.max(limit - 1, 0));

      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, { shipments: data ?? [] });
    }

    const { data: orders, error: ordersError } = await serviceClient
      .from("orders")
      .select("id")
      .eq("user_id", ctx.userId);

    if (ordersError) return jsonResponse(500, { error: ordersError.message });

    const ownedOrderIds = (orders ?? []).map((o) => o.id);
    if (ownedOrderIds.length === 0) {
      return jsonResponse(200, { shipments: [] });
    }

    let query = serviceClient
      .from("shipments")
      .select("*")
      .in("order_id", ownedOrderIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + Math.max(limit - 1, 0));

    if (status) query = query.eq("status", status);
    if (orderId) query = query.eq("order_id", orderId);

    const { data, error } = await query;
    if (error) return jsonResponse(500, { error: error.message });
    return jsonResponse(200, { shipments: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return jsonResponse(status, { error: message });
  }
});
