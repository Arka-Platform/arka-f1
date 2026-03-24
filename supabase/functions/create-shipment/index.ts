import { getRequestContext, requireAdmin } from "../_shared/auth.ts";
import { handleOptions, jsonResponse } from "../_shared/http.ts";

const ALLOWED_PREFERENCES = new Set(["cheapest", "fastest", "balanced", "manual"]);

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { ctx, serviceClient } = await getRequestContext(authHeader);
    requireAdmin(ctx);

    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" });
    }
    const orderId = body.order_id as string | undefined;
    const preference = (body.preference as string | undefined)?.trim().toLowerCase();
    const providerNameRaw = body.provider_name as string | undefined;
    const providerName = providerNameRaw?.trim() || null;

    if (!orderId) {
      return jsonResponse(400, { error: "order_id is required" });
    }
    if (!preference || !ALLOWED_PREFERENCES.has(preference)) {
      return jsonResponse(400, {
        error: "Invalid preference. Allowed: cheapest, fastest, balanced, manual",
      });
    }
    if (preference === "manual" && !providerName) {
      return jsonResponse(400, {
        error: "provider_name is required when preference is manual",
      });
    }

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      return jsonResponse(500, { error: "Failed to validate order" });
    }
    if (!order) {
      return jsonResponse(404, { error: "Order not found" });
    }

    const payload = {
      order_id: orderId,
      preference,
      provider_name: providerName,
      status: "pending_manual_dispatch",
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    };

    const { data: shipment, error: shipmentError } = await serviceClient
      .from("shipments")
      .insert(payload)
      .select("*")
      .single();

    if (shipmentError) {
      return jsonResponse(500, { error: shipmentError.message });
    }

    return jsonResponse(201, { shipment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message.includes("Unauthorized")
      ? 401
      : message.includes("Forbidden")
      ? 403
      : 500;
    return jsonResponse(status, { error: message });
  }
});
