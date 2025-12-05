# Frontend-Backend AWS Integration

This document explains how the frontend and backend are integrated with AWS infrastructure.

## Architecture Overview

```
┌─────────────────┐
│   CloudFront    │  (Frontend CDN)
│   Distribution  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   S3 Bucket     │  (Frontend Static Files)
│   (Frontend)    │
└─────────────────┘

┌─────────────────┐
│   ECS Fargate   │  (Backend API)
│   Service       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   RDS Aurora    │  (PostgreSQL Database)
│   PostgreSQL    │
└─────────────────┘
```

## AWS Account

**Account ID:** `600751737236`

## Components

### 1. Frontend Infrastructure

- **S3 Bucket**: Stores static frontend files (React build output)
- **CloudFront Distribution**: CDN for frontend with:
  - HTTPS by default
  - Custom error handling for SPA routing (404/403 → index.html)
  - Caching for static assets
  - Origin Access Control (OAC) for secure S3 access

**Location**: `modules/frontend/`

**Outputs**:
- `frontend_url`: The public URL to access the frontend
- `frontend_bucket_name`: S3 bucket name for deployment
- `frontend_cloudfront_distribution_id`: CloudFront distribution ID

### 2. Backend Infrastructure

- **ECS Fargate**: Runs the Spring Boot backend container
- **ECR**: Container registry for backend images
- **RDS Aurora PostgreSQL**: Database for backend

**Location**: `modules/compute/`, `modules/database/`, `modules/ecr/`

### 3. Integration Points

#### CORS Configuration

The backend is automatically configured with CORS to allow requests from the frontend:

1. **Terraform** sets the `FRONTEND_URL` environment variable in the ECS task definition
2. **Backend** reads `FRONTEND_URL` from environment (or uses CloudFront URL automatically)
3. **CorsConfig** in the backend uses this URL to configure allowed origins

**Configuration Flow**:
```
terraform.tfvars (frontend_url) 
  → main.tf (module.compute.frontend_url) 
  → modules/compute/main.tf (ECS task environment variable)
  → Backend container (FRONTEND_URL env var)
  → application.yml (app.cors.allowed-origins)
  → CorsConfig.java (CORS configuration)
```

#### Frontend API Configuration

The frontend needs to know the backend API URL:

1. **Build time**: Set `VITE_API_BASE_URL` environment variable
2. **Runtime**: Frontend reads from `import.meta.env.VITE_API_BASE_URL`
3. **Default**: Falls back to `http://localhost:8080` for local development

**File**: `frontend/src/utils/api.ts`

## Deployment Workflow

### 1. Deploy Infrastructure

```bash
cd arka-infra
terraform init
terraform plan
terraform apply
```

This creates:
- VPC and networking
- ECR repository
- RDS database
- ECS cluster and service
- S3 bucket for frontend
- CloudFront distribution

### 2. Deploy Backend

```bash
# From project root
./deploy.sh
```

This:
- Builds Docker image (frontend + backend)
- Pushes to ECR
- Updates ECS service

### 3. Deploy Frontend

```bash
cd arka-infra
./deploy-frontend.sh
```

This:
- Builds frontend
- Uploads to S3
- Invalidates CloudFront cache

### 4. Get Backend Endpoint

Since ALB is currently disabled, get the backend IP:

```bash
cd arka-infra
CLUSTER_NAME=$(terraform output -raw cluster_name)
SERVICE_NAME=$(terraform output -raw service_name)
AWS_REGION=$(terraform output -raw aws_region || echo "us-east-1")

# Get task IP
TASK_ARN=$(aws ecs list-tasks \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_NAME \
  --region $AWS_REGION \
  --query 'taskArns[0]' \
  --output text)

BACKEND_IP=$(aws ecs describe-tasks \
  --cluster $CLUSTER_NAME \
  --tasks $TASK_ARN \
  --region $AWS_REGION \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text | xargs -I {} aws ec2 describe-network-interfaces \
  --network-interface-ids {} \
  --region $AWS_REGION \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text)

echo "Backend URL: http://${BACKEND_IP}:8080"
```

### 5. Update Frontend with Backend URL

```bash
cd frontend
echo "VITE_API_BASE_URL=http://${BACKEND_IP}:8080" > .env.production
npm run build
cd ../arka-infra
./deploy-frontend.sh
```

## Environment Variables

### Backend (ECS Task)

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL`: PostgreSQL connection URL (auto-configured)
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `FRONTEND_URL`: Frontend URL for CORS (auto-configured from CloudFront)

### Frontend (Build Time)

- `VITE_API_BASE_URL`: Backend API URL (default: `http://localhost:8080`)

## URLs

After deployment, get URLs:

```bash
cd arka-infra

# Frontend URL
terraform output frontend_url

# Backend endpoint (requires manual retrieval - see step 4 above)
```

## Troubleshooting

### Frontend can't connect to backend

1. Check backend is running:
   ```bash
   aws ecs describe-services --cluster <cluster> --services <service> --region <region>
   ```

2. Verify CORS configuration:
   - Check `FRONTEND_URL` in ECS task definition
   - Check backend logs for CORS errors
   - Verify frontend URL matches backend CORS allowed origins

3. Check security groups:
   - ECS tasks should allow inbound traffic on port 8080
   - Currently configured for public access (for testing)

### Frontend not updating

1. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id <distribution-id> \
     --paths "/*"
   ```

2. Check S3 upload:
   ```bash
   aws s3 ls s3://<bucket-name>/
   ```

### Database connection issues

1. Check security group rules allow ECS → RDS (port 5432)
2. Verify database endpoint in ECS task environment variables
3. Check database credentials

## Next Steps

1. **Enable ALB**: Uncomment ALB resources in `modules/compute/main.tf` for production
2. **Custom Domain**: Configure Route53 and ACM certificate for custom domain
3. **Secrets Manager**: Move database password to AWS Secrets Manager
4. **CI/CD**: Set up automated deployment pipeline
5. **Monitoring**: Set up CloudWatch alarms and dashboards

