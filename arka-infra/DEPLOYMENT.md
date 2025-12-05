# Deployment Guide

This guide explains how to deploy the Arka application to AWS using Terraform.

## Prerequisites

1. AWS CLI configured with credentials
2. Terraform >= 1.6.0 installed
3. Docker installed (for building container images)
4. Maven installed (for building backend)
5. Node.js and npm installed (for building frontend)

## AWS Account Configuration

The AWS account ID is: **600751737236**

## Setup Steps

### 1. Configure Terraform Variables

Copy the example terraform.tfvars file and customize it:

```bash
cd arka-infra
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `aws_account_id = "600751737236"`
- `database_master_password` (set via environment variable for security)
- `frontend_url` (optional - will auto-generate from CloudFront if not set)

Set the database password:
```bash
export TF_VAR_database_master_password="your-secure-password"
```

### 2. Initialize and Plan Terraform

```bash
terraform init
terraform plan
```

### 3. Apply Infrastructure

```bash
terraform apply
```

This will create:
- VPC and networking resources
- ECR repository for container images
- RDS Aurora PostgreSQL cluster
- ECS Fargate cluster and service
- S3 buckets for storage and logs
- CloudWatch log groups

### 4. Build and Push Container Image

After infrastructure is created, get the ECR repository URL:

```bash
ECR_URL=$(terraform output -raw ecr_repository_url)
AWS_REGION=$(terraform output -raw aws_region || echo "us-east-1")
```

Login to ECR:
```bash
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL
```

Build and push the image:
```bash
cd ..
docker build -t arka-app .
docker tag arka-app:latest $ECR_URL:latest
docker push $ECR_URL:latest
```

### 5. Update ECS Service

After pushing the image, update the ECS service to use the new image:

```bash
CLUSTER_NAME=$(cd arka-infra && terraform output -raw cluster_name)
SERVICE_NAME=$(cd arka-infra && terraform output -raw service_name)

aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --force-new-deployment \
  --region $AWS_REGION
```

### 6. Get Service Endpoint

Since ALB is currently disabled, you'll need to get the task IP addresses:

```bash
# List tasks
TASK_ARN=$(aws ecs list-tasks \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_NAME \
  --region $AWS_REGION \
  --query 'taskArns[0]' \
  --output text)

# Get task details
aws ecs describe-tasks \
  --cluster $CLUSTER_NAME \
  --tasks $TASK_ARN \
  --region $AWS_REGION \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text | xargs -I {} aws ec2 describe-network-interfaces \
  --network-interface-ids {} \
  --region $AWS_REGION \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text
```

The backend API will be available at: `http://<TASK_IP>:8080`

### 7. Deploy Frontend to S3

After infrastructure is created, get the frontend bucket name:

```bash
FRONTEND_BUCKET=$(cd arka-infra && terraform output -raw frontend_bucket_name)
AWS_REGION=$(cd arka-infra && terraform output -raw aws_region || echo "us-east-1")
```

Build the frontend:

```bash
cd frontend
npm install
npm run build
```

Upload frontend to S3:

```bash
aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete --region $AWS_REGION
```

Get the backend endpoint and configure frontend:

```bash
# Get backend task IP (see step 6)
BACKEND_IP=<TASK_IP>

# Create .env.production with backend URL
echo "VITE_API_BASE_URL=http://${BACKEND_IP}:8080" > .env.production

# Rebuild and redeploy
npm run build
aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete --region $AWS_REGION
```

### 8. Invalidate CloudFront Cache (if CloudFront is enabled)

After deploying frontend updates:

```bash
CLOUDFRONT_ID=$(cd arka-infra && terraform output -raw frontend_cloudfront_distribution_id)
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/*" \
  --region $AWS_REGION
```

### 9. Access Your Application

Get the frontend URL:

```bash
cd arka-infra
terraform output frontend_url
```

The frontend will be available at the CloudFront URL (or S3 website endpoint if CloudFront is disabled).

## Environment Variables

The backend container receives these environment variables:

- `SPRING_PROFILES_ACTIVE=prod` - Activates production profile
- `DB_URL` - PostgreSQL connection URL (auto-configured from RDS endpoint)
- `DB_USERNAME` - Database username (from terraform variables)
- `DB_PASSWORD` - Database password (from terraform variables)
- `FRONTEND_URL` - Frontend URL for CORS (from terraform variables)

## Database Connection

The backend automatically connects to the RDS Aurora PostgreSQL cluster using:
- Endpoint: Retrieved from Terraform outputs
- Database: `arka` (or value from `database_name` variable)
- Username: From `database_master_username` variable
- Password: From `database_master_password` variable

## Troubleshooting

### View ECS Service Logs

```bash
LOG_GROUP=$(aws logs describe-log-groups \
  --log-group-name-prefix "/ecs/$CLUSTER_NAME" \
  --region $AWS_REGION \
  --query 'logGroups[0].logGroupName' \
  --output text)

aws logs tail $LOG_GROUP --follow --region $AWS_REGION
```

### Check ECS Service Status

```bash
aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $AWS_REGION
```

### Database Connection Issues

Ensure the ECS task security group can access the RDS security group. This is automatically configured, but verify:

```bash
# Check security group rules
aws ec2 describe-security-groups \
  --group-ids $(terraform output -raw service_security_group_id) \
  --region $AWS_REGION
```

## Next Steps

1. **Enable ALB**: Uncomment ALB resources in `modules/compute/main.tf` for production use
2. **Set up CloudFront**: Deploy frontend to S3 and CloudFront for better performance
3. **Use Secrets Manager**: Move database password to AWS Secrets Manager
4. **Set up CI/CD**: Automate build and deployment pipeline
5. **Configure Domain**: Set up Route53 and custom domain









