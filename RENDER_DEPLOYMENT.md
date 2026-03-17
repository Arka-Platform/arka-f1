# Render Deployment (Backend + Postgres)

Use **Render** to host:

- the Spring Boot backend (`arka-backend`)
- a managed PostgreSQL database

## Backend (Web Service)

Create a new **Web Service** on Render.

- Root directory: `arka-backend`
- Build command: `mvn -q -DskipTests package`
- Start command: `java -jar target/arka-backend-*.jar`
- Health check path (optional): `/actuator/health`

### Required environment variables

Set these in Render → Environment:

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL` (JDBC URL, e.g. `jdbc:postgresql://...`)
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET` (set a strong value)
- `FRONTEND_URL` (your Vercel URL) for CORS

Optional (if used):

- SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`)
- Porter (`PORTER_ENABLED`, `PORTER_BASE_URL`, `PORTER_API_KEY`, `PORTER_WEBHOOK_SECRET`, etc.)

## Database (Render Postgres)

Create a Render **PostgreSQL** instance and copy connection details into:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`

Flyway migrations are enabled; tables will be managed by the app at startup.

## Frontend (Vercel)

Deploy `frontend/` to Vercel and set:

- `VITE_API_BASE_URL` = Render backend URL

