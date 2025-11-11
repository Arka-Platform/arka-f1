# Deploy and Test Infrastructure

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws configure
   ```

2. **Terraform installed** (>= 1.6.0)
   ```bash
   terraform --version
   ```

3. **Docker image built and pushed to ECR**
   - Image should be in AWS account: `934189896155`
   - Region: `us-east-1` (or your configured region)

## Step 1: Build and Push Docker Image

```bash
# Navigate to project root
cd /Users/sharvani/Desktop/arka-f1

# Build the Docker image
docker build -t arka-app:latest .

# Get AWS account and region
AWS_ACCOUNT=934189896155
AWS_REGION=us-east-1

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repository if it doesn't exist
aws ecr create-repository --repository-name arka-app --region $AWS_REGION 2>/dev/null || true

# Tag and push image
docker tag arka-app:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/arka-app:latest
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/arka-app:latest

# Note the image URI
IMAGE_URI="$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/arka-app:latest"
echo "Image URI: $IMAGE_URI"
```

## Step 2: Configure Terraform Variables

Create a `terraform.tfvars` file:

```bash
cd arka-infra
cat > terraform.tfvars <<EOF
project     = "arka"
environment = "dev"
aws_region  = "us-east-1"

# Container image (use the IMAGE_URI from Step 1)
container_image = "934189896155.dkr.ecr.us-east-1.amazonaws.com/arka-app:latest"

# Compute resources
desired_count = 2
fargate_cpu   = 512
fargate_memory = 1024
container_port = 8080

# Database (required - use a strong password!)
database_master_username = "postgres"
database_master_password = "CHANGE_ME_TO_STRONG_PASSWORD"

# Storage
app_storage_bucket_enabled = true
log_bucket_enabled = true
EOF
```

**⚠️ IMPORTANT**: Change `database_master_password` to a strong password!

## Step 3: Initialize and Plan

```bash
cd arka-infra

# Initialize Terraform
terraform init

# Review the plan
terraform plan -var-file=terraform.tfvars
```

## Step 4: Deploy Infrastructure

```bash
# Apply the configuration
terraform apply -var-file=terraform.tfvars

# Type 'yes' when prompted
```

This will create:
- VPC and networking
- ECS cluster and service (2 tasks, publicly accessible)
- RDS Aurora PostgreSQL database
- S3 buckets for logs and storage
- Security groups and IAM roles

**Deployment takes ~10-15 minutes** (mostly for RDS).

## Step 5: Get Task Information

After deployment, get the cluster and service names:

```bash
# Get outputs
terraform output

# Or manually set them
CLUSTER_NAME=$(terraform output -raw cluster_name)
SERVICE_NAME=$(terraform output -raw service_name)
REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")

echo "Cluster: $CLUSTER_NAME"
echo "Service: $SERVICE_NAME"
```

## Step 6: Test Connectivity

### Option 1: Use the Test Script

```bash
# Run the test script
./test-connectivity.sh "$CLUSTER_NAME" "$SERVICE_NAME" "$REGION"
```

### Option 2: Manual Testing

```bash
# Get running tasks
aws ecs list-tasks \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --region "$REGION"

# Get task details (replace TASK_ARN with actual task ARN)
TASK_ARN="<task-arn-from-above>"
aws ecs describe-tasks \
  --cluster "$CLUSTER_NAME" \
  --tasks "$TASK_ARN" \
  --region "$REGION" \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text

# Get public IP from network interface
NETWORK_INTERFACE_ID="<network-interface-id-from-above>"
PUBLIC_IP=$(aws ec2 describe-network-interfaces \
  --network-interface-ids "$NETWORK_INTERFACE_ID" \
  --region "$REGION" \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text)

echo "Public IP: $PUBLIC_IP"

# Test endpoints
curl http://${PUBLIC_IP}:8080/actuator/health
curl http://${PUBLIC_IP}:8080/api/v1/books
curl http://${PUBLIC_IP}:8080/
```

## Step 7: Verify Frontend-Backend Connection

### Test Frontend
Open in browser:
```
http://<PUBLIC_IP>:8080
```

You should see the React frontend.

### Test Backend API
```bash
# List books
curl http://<PUBLIC_IP>:8080/api/v1/books

# Create a book (example)
curl -X POST http://<PUBLIC_IP>:8080/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Book",
    "author": "Test Author",
    "description": "A test book",
    "price": 19.99,
    "status": "AVAILABLE"
  }'
```

### Test Database Connection

The application should automatically connect to RDS Aurora PostgreSQL. Check logs:

```bash
# Get log group name
LOG_GROUP="/ecs/arka/dev"

# View recent logs
aws logs tail "$LOG_GROUP" --follow --region "$REGION"
```

## Troubleshooting

### Tasks Not Starting

1. **Check task status:**
   ```bash
   aws ecs describe-tasks \
     --cluster "$CLUSTER_NAME" \
     --tasks <task-arn> \
     --region "$REGION"
   ```

2. **Check task logs:**
   ```bash
   aws logs tail "/ecs/arka/dev" --follow
   ```

3. **Common issues:**
   - Image pull errors → Check ECR permissions
   - Container exit → Check application logs
   - Health check failures → Verify health endpoint

### Cannot Access Application

1. **Check security group:**
   ```bash
   # Get security group ID from terraform output
   SG_ID=$(terraform output -raw service_security_group_id)
   
   # Check ingress rules
   aws ec2 describe-security-groups \
     --group-ids "$SG_ID" \
     --region "$REGION"
   ```

2. **Verify public IP:**
   - Tasks must be in public subnets
   - `assign_public_ip = true` must be set
   - Check NAT Gateway is working

### Database Connection Issues

1. **Check database endpoint:**
   ```bash
   terraform output database_cluster_endpoint
   ```

2. **Verify security group:**
   - ECS service security group must be allowed in RDS security group
   - Check terraform outputs for security group IDs

3. **Test connection:**
   ```bash
   # From an ECS task (or use AWS Systems Manager Session Manager)
   # psql -h <database-endpoint> -U postgres -d arka
   ```

## Clean Up

To destroy all resources:

```bash
terraform destroy -var-file=terraform.tfvars
```

**⚠️ WARNING**: This will delete:
- All infrastructure
- Database (data will be lost unless snapshots are enabled)
- S3 buckets (if empty)

## Next Steps

1. **Re-enable ALB** (uncomment in `modules/compute/main.tf`)
2. **Add HTTPS** with ACM certificate
3. **Configure auto-scaling**
4. **Set up monitoring and alerts**
5. **Implement CI/CD pipeline**

## Notes

- **Task IPs are dynamic**: They change when tasks restart
- **For production**: Use ALB with a fixed DNS name
- **Security**: Direct public access is for testing only
- **Cost**: Monitor AWS costs, especially RDS Aurora

