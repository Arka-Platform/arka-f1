# Architecture Rules

- Never group code by development phases (tiers)
- Always group by domain or feature
- One domain = one migration (users, wishlist, orders, etc.)
- No duplicate implementations
- Database logic must live in supabase/migrations