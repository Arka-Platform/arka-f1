import { getRequestContext, requireAdmin } from "../_shared/auth.ts";
import { handleOptions, jsonResponse } from "../_shared/http.ts";

const ALLOWED_STATUSES = new Set([
  "pending_manual_dispatch",
  "dispatched",
  "in_transit",
  "delivered",
]);

const VALID_TRANSITIONS: Record<string, Set<string>> = {
  pending_manual_dispatch: new Set(["dispatched"]),
  dispatched: new Set(["in_transit", "delivered"]),
  in_transit: new Set(["delivered"]),
  delivered: new Set([]),
};

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "PATCH" && req.method !== "POST") {
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
    const shipmentId = body.id as string | undefined;
    const nextStatus = (body.status as string | undefined)?.trim().toLowerCase();
    const trackingId = (body.tracking_id as string | undefined)?.trim() || null;
    const providerName = (body.provider_name as string | undefined)?.trim() || null;

    if (!shipmentId) {
      return jsonResponse(400, { error: "id is required" });
    }

    const { data: existing, error: fetchError } = await serviceClient
      .from("shipments")
      .select("*")
      .eq("id", shipmentId)
      .maybeSingle();

    if (fetchError) {
      return jsonResponse(500, { error: fetchError.message });
    }
    if (!existing) {
      return jsonResponse(404, { error: "Shipment not found" });
    }

    if (nextStatus) {
      if (!ALLOWED_STATUSES.has(nextStatus)) {
        return jsonResponse(400, {
          error:
            "Invalid status. Allowed: pending_manual_dispatch, dispatched, in_transit, delivered",
        });
      }
      if (nextStatus !== existing.status && !VALID_TRANSITIONS[existing.status]?.has(nextStatus)) {
        return jsonResponse(400, {
          error: `Invalid transition from ${existing.status} to ${nextStatus}`,
        });
      }
    }

    const targetStatus = nextStatus ?? existing.status;
    const targetTracking = trackingId ?? existing.tracking_id;
    if ((targetStatus === "dispatched" || targetStatus === "in_transit" || targetStatus === "delivered") && !targetTracking) {
      return jsonResponse(400, {
        error: "tracking_id is required once shipment is dispatched",
      });
    }

    const updatePayload: Record<string, unknown> = {};
    if (nextStatus) updatePayload.status = nextStatus;
    if (body.tracking_id !== undefined) updatePayload.tracking_id = trackingId;
    if (body.provider_name !== undefined) updatePayload.provider_name = providerName;
    if (body.metadata !== undefined && typeof body.metadata === "object") {
      updatePayload.metadata = body.metadata;
    }

    if (Object.keys(updatePayload).length === 0) {
      return jsonResponse(400, { error: "No mutable fields provided" });
    }

    const { data: updated, error: updateError } = await serviceClient
      .from("shipments")
      .update(updatePayload)
      .eq("id", shipmentId)
      .select("*")
      .single();

    if (updateError) {
      return jsonResponse(500, { error: updateError.message });
    }

    return jsonResponse(200, { shipment: updated });
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
