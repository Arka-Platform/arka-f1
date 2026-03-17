# Vercel Deployment (Frontend)

This repo uses **Vite + React** in `frontend/`.

## Deploy

1. Create a new Vercel project.
2. Set **Root Directory** to `frontend`.
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Environment variables:
   - `VITE_API_BASE_URL`: your backend API base URL (e.g. `https://<your-backend-domain>`)

## SPA routing

Vercel should serve `index.html` for client-side routes. This is configured via `frontend/vercel.json`.

