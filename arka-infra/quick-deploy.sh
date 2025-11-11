#!/bin/bash

# Quick deployment script for Arka infrastructure
# AWS Account: 934189896155

set -e

AWS_ACCOUNT="934189896155"
AWS_REGION="us-east-1"
PROJECT="arka"
ENVIRONMENT="dev"

echo "========================================="
echo "Arka Infrastructure Deployment"
echo "========================================="
echo "Account: $AWS_ACCOUNT"
echo "Region: $AWS_REGION"
echo "Project: $PROJECT"
echo "Environment: $ENVIRONMENT"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Check AWS credentials
echo "🔍 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    exit 1
fi

CURRENT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
if [ "$CURRENT_ACCOUNT" != "$AWS_ACCOUNT" ]; then
    echo "⚠️  Warning: Current AWS account ($CURRENT_ACCOUNT) doesn't match expected ($AWS_ACCOUNT)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ AWS credentials valid"
echo ""

# Step 1: Build and push Docker image
echo "📦 Step 1: Building and pushing Docker image..."
cd ..

IMAGE_NAME="arka-app"
IMAGE_TAG="latest"
ECR_REPO="$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME"
IMAGE_URI="$ECR_REPO:$IMAGE_TAG"

# Build image
echo "  Building Docker image..."
docker build -t "$IMAGE_NAME:$IMAGE_TAG" .

# Login to ECR
echo "  Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$ECR_REPO" 2>/dev/null || \
    aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com"

# Create repository if it doesn't exist
echo "  Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names "$IMAGE_NAME" --region "$AWS_REGION" &>/dev/null || \
    aws ecr create-repository --repository-name "$IMAGE_NAME" --region "$AWS_REGION" > /dev/null

# Tag and push
echo "  Tagging and pushing image..."
docker tag "$IMAGE_NAME:$IMAGE_TAG" "$IMAGE_URI"
docker push "$IMAGE_URI"

echo "✅ Image pushed: $IMAGE_URI"
echo ""

# Step 2: Prepare Terraform variables
echo "📝 Step 2: Preparing Terraform configuration..."
cd arka-infra

# Generate database password if not set
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    echo "  Generated database password (saved to .db-password)"
    echo "$DB_PASSWORD" > .db-password
    chmod 600 .db-password
else
    echo "  Using provided database password"
fi

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
project     = "$PROJECT"
environment = "$ENVIRONMENT"
aws_region  = "$AWS_REGION"

# Container image
container_image = "$IMAGE_URI"

# Compute resources
desired_count   = 2
fargate_cpu     = 512
fargate_memory  = 1024
container_port  = 8080

# Database
database_master_username = "postgres"
database_master_password = "$DB_PASSWORD"

# Storage
app_storage_bucket_enabled = true
log_bucket_enabled         = true
EOF

echo "✅ Configuration file created: terraform.tfvars"
echo ""

# Step 3: Initialize Terraform
echo "🔧 Step 3: Initializing Terraform..."
terraform init

echo "✅ Terraform initialized"
echo ""

# Step 4: Plan
echo "📋 Step 4: Planning infrastructure changes..."
terraform plan -var-file=terraform.tfvars

echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Step 5: Apply
echo "🚀 Step 5: Deploying infrastructure..."
terraform apply -var-file=terraform.tfvars -auto-approve

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""

# Get outputs
CLUSTER_NAME=$(terraform output -raw cluster_name)
SERVICE_NAME=$(terraform output -raw service_name)

echo "Cluster: $CLUSTER_NAME"
echo "Service: $SERVICE_NAME"
echo ""

echo "📋 Next steps:"
echo "1. Wait 2-3 minutes for tasks to start"
echo "2. Run test script: ./test-connectivity.sh \"$CLUSTER_NAME\" \"$SERVICE_NAME\" \"$AWS_REGION\""
echo "3. Or manually get task IPs from ECS console"
echo ""
echo "🔐 Database password saved to: .db-password"
echo ""

