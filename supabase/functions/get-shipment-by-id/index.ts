import { getRequestContext } from "../_shared/auth.ts";
import { handleOptions, jsonResponse } from "../_shared/http.ts";

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
    const shipmentId = (url.searchParams.get("id") ?? (body.id as string | undefined) ?? null)?.trim();

    if (!shipmentId) {
      return jsonResponse(400, { error: "id is required" });
    }

    const { data: shipment, error: shipmentError } = await serviceClient
      .from("shipments")
      .select("*")
      .eq("id", shipmentId)
      .maybeSingle();

    if (shipmentError) return jsonResponse(500, { error: shipmentError.message });
    if (!shipment) return jsonResponse(404, { error: "Shipment not found" });

    if (ctx.isAdmin) {
      return jsonResponse(200, { shipment });
    }

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id,user_id")
      .eq("id", shipment.order_id)
      .maybeSingle();

    if (orderError) return jsonResponse(500, { error: orderError.message });
    if (!order || order.user_id !== ctx.userId) {
      return jsonResponse(403, { error: "Forbidden" });
    }

    return jsonResponse(200, { shipment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return jsonResponse(status, { error: message });
  }
});
