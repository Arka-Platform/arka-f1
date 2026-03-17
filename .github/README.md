# GitHub Actions Setup (No AWS)

## Setup Instructions

This repo no longer deploys to AWS (ECR/ECS/Terraform removed).

### What remains

- Docker build/test workflows:
  - `test-docker-build.yml`
  - `test-docker-build-only.yml`

### Deployments

- Frontend deploy: see `VERCEL_DEPLOYMENT.md`
- Backend deploy: see `RENDER_DEPLOYMENT.md`

## Workflow Files

- **`test-docker-build-only.yml`**: Build-only checks
- **`test-docker-build.yml`**: Build + basic runtime checks

