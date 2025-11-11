# Arka Platform Monorepo

This repository contains the frontend (React + Vite) and backend (Spring Boot modular monolith) for the Arka platform. The project is structured so that both applications can be built into a single container image suitable for deployment to AWS ECS.

```
arka-f1/
├── frontend/                  # React 18 + Vite + TypeScript SPA
├── arka-backend/              # Spring Boot backend (modular monolith in a single module)
│   ├── src/main/java/com/arka/
│   │   ├── common/            # shared domain primitives & results
│   │   ├── config/            # security, CORS, SPA forwarding, etc.
│   │   ├── core/              # optional domain interfaces
│   │   ├── modules/
│   │   │   ├── marketplace/   # marketplace (books) module
│   │   │   ├── recycling/     # recycling module (placeholder)
│   │   │   └── user/          # user module (placeholder)
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── static/            # React build copied here
│   │   └── db/migration/      # Flyway scripts
│   └── pom.xml
├── docs/                      # architecture & review documents
├── Dockerfile                 # Multi-stage build producing single deployable image
└── README.md
```

## Frontend (React + Vite)

```
cd frontend
npm install
npm run dev            # http://localhost:5173
npm run build          # output in frontend/dist
```

Build artifacts are later copied into the backend so Spring Boot can serve them from `classpath:/static`.

## Backend (Spring Boot 3, Java 21)

```
cd arka-backend
./mvnw clean verify
./mvnw spring-boot:run   # http://localhost:8080
```

### Modules
- `common`: base entity, result helpers.
- `modules/marketplace`: book catalog domain (JPA + Flyway + REST).
- `modules/recycling`, `modules/user`: placeholders for future features.
- `config`: security, CORS, SPA forwarding.

### API
- `POST /api/v1/books` – Create a book (H2 + Flyway schema).
- `GET /api/v1/books` – List books (paged).
- Actuator: `/actuator/health`, `/actuator/info`, `/actuator/prometheus`.

## Docker (single image for ECS)

The repository includes a multi-stage Dockerfile that:
1. Builds the frontend with Node.
2. Copies the built assets into the backend’s `static/` folder.
3. Packages the Spring Boot application with Maven.
4. Produces a minimal runtime image.

```
docker build -t arka-app .
docker run -p 8080:8080 arka-app
```

The container serves both the API and SPA from port 8080, making it straightforward to deploy on a single ECS task.

## AWS ECS Notes
- Use AWS Fargate or EC2 launch type.
- Task definition exposes port 8080; configure health checks against `/actuator/health/readiness`.
- Store configuration (DB credentials, secrets) in AWS SSM Parameter Store or Secrets Manager; map via environment variables.
- Attach CloudWatch Logs to capture structured Spring Boot logs.

## CI/CD Recommendations
- Frontend: lint (`npm run lint`), unit tests (`npm run test`).
- Backend: `mvn clean verify` with Testcontainers for integration tests (when DB added).
- Build/push Docker image to ECR (GitHub Actions workflow).
- Deploy ECS service via AWS CDK, Terraform, or AWS Copilot.

## Local Development Flow
1. Run frontend dev server (`npm run dev`) for fast iteration.
2. Run backend (`./mvnw spring-boot:run`) for API testing.
3. When ready to integrate, build frontend and copy to backend static folder (Dockerfile automates this).

## Future Enhancements
- Replace H2 with PostgreSQL + production Flyway migrations.
- Expand marketplace feature set; flesh out recycling & user modules.
- Introduce authentication/authorization with JWT and OAuth2.
- Expand observability: OpenTelemetry tracing, Prometheus dashboards, alerting.

