#!/bin/bash

# Script to deploy frontend to S3 and invalidate CloudFront cache
# Usage: ./deploy-frontend.sh [frontend-directory]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="${1:-$PROJECT_ROOT/frontend}"

echo "🚀 Deploying frontend..."

# Check if terraform outputs are available
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed or not in PATH"
    exit 1
fi

cd "$SCRIPT_DIR"

# Get Terraform outputs
echo "📋 Getting infrastructure information..."
FRONTEND_BUCKET=$(terraform output -raw frontend_bucket_name 2>/dev/null || echo "")
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")
CLOUDFRONT_ID=$(terraform output -raw frontend_cloudfront_distribution_id 2>/dev/null || echo "")

if [ -z "$FRONTEND_BUCKET" ]; then
    echo "❌ Could not get frontend bucket name from Terraform outputs"
    echo "   Make sure you've run 'terraform apply' first"
    exit 1
fi

echo "   Bucket: $FRONTEND_BUCKET"
echo "   Region: $AWS_REGION"
if [ -n "$CLOUDFRONT_ID" ]; then
    echo "   CloudFront ID: $CLOUDFRONT_ID"
fi

# Build frontend
echo ""
echo "🔨 Building frontend..."
cd "$FRONTEND_DIR"

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in $FRONTEND_DIR"
    exit 1
fi

# Get backend URL from Terraform (if available)
BACKEND_IP=""
cd "$SCRIPT_DIR"
if terraform output service_endpoint_info &>/dev/null; then
    echo "   Note: Backend endpoint needs to be retrieved manually"
    echo "   Use: aws ecs list-tasks --cluster <cluster-name> --service-name <service-name>"
fi

# Build with environment variable if backend IP is known
if [ -n "$BACKEND_IP" ]; then
    echo "   Using backend URL: http://${BACKEND_IP}:8080"
    VITE_API_BASE_URL="http://${BACKEND_IP}:8080" npm run build
else
    echo "   Building without backend URL (set VITE_API_BASE_URL in .env.production if needed)"
    npm run build
fi

# Upload to S3
echo ""
echo "📤 Uploading to S3..."
aws s3 sync dist/ "s3://$FRONTEND_BUCKET" --delete --region "$AWS_REGION"

echo "✅ Frontend deployed to S3"

# Invalidate CloudFront cache if CloudFront is enabled
if [ -n "$CLOUDFRONT_ID" ]; then
    echo ""
    echo "🔄 Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_ID" \
        --paths "/*" \
        --region "$AWS_REGION" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
    echo "   Cache will be invalidated in a few minutes"
fi

# Get frontend URL
echo ""
echo "🌐 Frontend URL:"
cd "$SCRIPT_DIR"
terraform output frontend_url

echo ""
echo "✨ Deployment complete!"








