# Quick Start Guide

## AWS Account
- **Account ID**: 600751737236
- **Default Region**: us-east-1

## Initial Setup

1. **Configure Terraform variables:**
   ```bash
   cd arka-infra
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Set database password:**
   ```bash
   export TF_VAR_database_master_password="your-secure-password"
   ```

3. **Initialize and deploy:**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

## Build and Deploy Application

From the project root:

```bash
./deploy.sh
```

This script will:
- Get ECR repository URL from Terraform
- Build the Docker image
- Push to ECR
- Optionally update the ECS service

## Get Service Endpoint

Since ALB is disabled, get the task IP:

```bash
cd arka-infra
CLUSTER=$(terraform output -raw cluster_name)
SERVICE=$(terraform output -raw service_name)
REGION=$(grep aws_region terraform.tfvars | cut -d'"' -f2 || echo "us-east-1")

# Get task IP
TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER --service-name $SERVICE --region $REGION --query 'taskArns[0]' --output text)
ENI_ID=$(aws ecs describe-tasks --cluster $CLUSTER --tasks $TASK_ARN --region $REGION --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
TASK_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --region $REGION --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

echo "Backend API: http://$TASK_IP:8080"
```

## Key Terraform Outputs

```bash
cd arka-infra
terraform output
```

Important outputs:
- `ecr_repository_url` - ECR repository for container images
- `database_cluster_endpoint` - RDS endpoint
- `cluster_name` - ECS cluster name
- `service_name` - ECS service name

## Frontend Deployment

The frontend is automatically configured with S3 + CloudFront. Deploy it:

```bash
cd arka-infra
./deploy-frontend.sh
```

This will:
- Build the frontend
- Upload to S3
- Invalidate CloudFront cache

Get the frontend URL:
```bash
terraform output frontend_url
```

### Configure Frontend with Backend URL

Before deploying frontend, get the backend IP (see "Get Service Endpoint" above), then:

```bash
cd frontend
echo "VITE_API_BASE_URL=http://<BACKEND_IP>:8080" > .env.production
cd ../arka-infra
./deploy-frontend.sh
```

## Key Terraform Outputs

```bash
cd arka-infra
terraform output
```

Important outputs:
- `ecr_repository_url` - ECR repository for container images
- `frontend_url` - Frontend CloudFront URL
- `frontend_bucket_name` - S3 bucket for frontend
- `database_cluster_endpoint` - RDS endpoint
- `cluster_name` - ECS cluster name
- `service_name` - ECS service name

## Next Steps

1. Enable ALB for production (uncomment in `modules/compute/main.tf`)
2. Set up custom domain with Route53 and ACM certificate
3. Configure CI/CD pipeline
4. Move secrets to AWS Secrets Manager









