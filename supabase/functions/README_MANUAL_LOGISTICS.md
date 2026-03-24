# Manual Logistics API (Arka)

This module implements a manual-only logistics workflow using Supabase Postgres + Edge Functions.

No courier APIs are used. `provider_name` is a plain label.

## Folder Structure

```text
supabase/
  migrations/
    20260324170000_manual_logistics_shipments.sql
  functions/
    _shared/
      auth.ts
      http.ts
    create-shipment/
      index.ts
    update-shipment/
      index.ts
    get-shipments/
      index.ts
    get-shipment-by-id/
      index.ts
```

## Endpoints

- `POST /functions/v1/create-shipment`
- `PATCH /functions/v1/update-shipment` (also accepts `POST`)
- `GET /functions/v1/get-shipments`
- `GET /functions/v1/get-shipment-by-id`

## Example Requests

### Create shipment

```bash
curl -X POST "$SUPABASE_URL/functions/v1/create-shipment" \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "6f92339c-326f-4c73-9f7f-2dc9f6450ea4",
    "preference": "manual",
    "provider_name": "india_post",
    "metadata": {
      "notes": "Fragile package"
    }
  }'
```

### Update shipment (dispatch + tracking)

```bash
curl -X PATCH "$SUPABASE_URL/functions/v1/update-shipment" \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "3cff9ed5-a42e-4f7f-849f-f724d6d8d3ac",
    "tracking_id": "INDP123456789",
    "status": "dispatched",
    "provider_name": "india_post"
  }'
```

### List shipments (optional filters)

```bash
curl "$SUPABASE_URL/functions/v1/get-shipments?status=pending_manual_dispatch&limit=20&offset=0" \
  -H "Authorization: Bearer <jwt>"
```

### Fetch one shipment

```bash
curl "$SUPABASE_URL/functions/v1/get-shipment-by-id?id=3cff9ed5-a42e-4f7f-849f-f724d6d8d3ac" \
  -H "Authorization: Bearer <jwt>"
```

## Example Responses

### `create-shipment` success (`201`)

```json
{
  "shipment": {
    "id": "3cff9ed5-a42e-4f7f-849f-f724d6d8d3ac",
    "order_id": "6f92339c-326f-4c73-9f7f-2dc9f6450ea4",
    "provider_name": "india_post",
    "preference": "manual",
    "tracking_id": null,
    "status": "pending_manual_dispatch",
    "metadata": {
      "notes": "Fragile package"
    },
    "created_at": "2026-03-24T17:00:00.000Z",
    "updated_at": "2026-03-24T17:00:00.000Z"
  }
}
```

### `update-shipment` success (`200`)

```json
{
  "shipment": {
    "id": "3cff9ed5-a42e-4f7f-849f-f724d6d8d3ac",
    "order_id": "6f92339c-326f-4c73-9f7f-2dc9f6450ea4",
    "provider_name": "india_post",
    "preference": "manual",
    "tracking_id": "INDP123456789",
    "status": "dispatched",
    "metadata": {
      "notes": "Fragile package"
    },
    "created_at": "2026-03-24T17:00:00.000Z",
    "updated_at": "2026-03-24T17:11:42.000Z"
  }
}
```

## Lifecycle Rules

- Allowed statuses:
  - `pending_manual_dispatch`
  - `dispatched`
  - `in_transit`
  - `delivered`
- Allowed transitions:
  - `pending_manual_dispatch -> dispatched`
  - `dispatched -> in_transit | delivered`
  - `in_transit -> delivered`
- `tracking_id` is required before/when shipment is dispatched.
- If `preference = manual`, `provider_name` must be set.

## Security

- Edge functions require authenticated users.
- `create-shipment` and `update-shipment` are admin-only.
- Reads support:
  - Admin: all shipments.
  - User: shipments only for their own orders.

