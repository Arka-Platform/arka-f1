# GitHub Actions Workflows

This directory contains GitHub Actions workflows for building, testing, and deploying the Arka platform.

## Available Workflows

### 1. Test Docker Build (`test-docker-build.yml`)
**Purpose:** Build and test the Docker image (no AWS push)

**Triggers:**
- Manual trigger (workflow_dispatch)
- Push to dev/main/master (when Dockerfile or code changes)
- Pull requests (when Dockerfile or code changes)

**What it does:**
- Builds the Docker image
- Runs the container
- Tests health endpoint
- Tests API endpoint
- Tests frontend
- Shows container logs
- Cleans up automatically

**Use this when:**
- You want to test Docker builds without Docker locally
- You want to verify the image works before deploying
- You're making changes to Dockerfile or build process

**How to run:**
1. Go to Actions tab in GitHub
2. Select "Test Docker Build"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### 2. Test Docker Build (Build Only) (`test-docker-build-only.yml`)
**Purpose:** Just build and verify the Docker image structure (faster, no runtime tests)

**Triggers:**
- Manual trigger (workflow_dispatch)
- Push to dev/main/master (when Dockerfile or code changes)

**What it does:**
- Builds the Docker image
- Verifies image exists
- Shows image size and layers
- Checks image structure (app.jar, static files)
- No runtime testing (faster)

**Use this when:**
- You just want to verify the build succeeds
- You want to check image size
- You don't need runtime testing

### 3. Build and Push to ECR (`deploy-to-ecr.yml`) (removed)
**Purpose:** Removed (AWS is no longer used)

**Triggers:**
- Manual trigger (workflow_dispatch)
- Push to dev/main/master (when code changes)
- Pull requests (when code changes)

**What it did:**
- Built the Docker image
- Pushed to ECR (removed)

**Use this when:**
- N/A (removed)

### 4. Build and Push to ECR (Simple) (`deploy-to-ecr-simple.yml`) (removed)
**Purpose:** Removed (AWS is no longer used)

**Use this when:**
- N/A (removed)

## Workflow Comparison

| Workflow | Build | Test Runtime | Push to ECR | Speed |
|----------|-------|--------------|------------|-------|
| test-docker-build | ✅ | ✅ | ❌ | Medium |
| test-docker-build-only | ✅ | ❌ | ❌ | Fast |
| deploy-to-ecr | ❌ | ❌ | ❌ | N/A |
| deploy-to-ecr-simple | ❌ | ❌ | ❌ | N/A |

## Recommended Workflow

1. **During Development:**
   - Use `test-docker-build-only` for quick build verification
   - Use `test-docker-build` when you want to test the full application

2. **Before Deployment:**
   - Use `test-docker-build` to verify everything works
   - Deploy frontend to Vercel (see `VERCEL_DEPLOYMENT.md`)
   - Deploy backend to Render (see `RENDER_DEPLOYMENT.md`)

3. **For Pull Requests:**
   - All workflows run automatically on PRs
   - Review the test results before merging

## Running Workflows Manually

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select the workflow you want to run
4. Click "Run workflow" button
5. Select the branch
6. Click "Run workflow"

## Viewing Results

After a workflow runs:
- Click on the workflow run
- Expand each step to see logs
- Check for any errors or warnings
- Download artifacts if any

## Troubleshooting

### Build Fails
- Check Dockerfile syntax
- Verify all dependencies are available
- Check build logs for specific errors

### Tests Fail
- Check application logs in the test step
- Verify health endpoint is accessible
- Check if application starts correctly

### Push to ECR Fails
- Removed workflows: ECR/ECS/Terraform deployment was deleted when migrating to Vercel + Render.

## Local Testing Alternative

If you prefer to test locally (but want to avoid Docker taking up space):

1. Use `test-docker-build` workflow in GitHub Actions
2. Or use the local development setup:
   ```bash
   ./run-local.sh  # No Docker needed
   ```

This runs frontend and backend separately without Docker.






















