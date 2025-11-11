#!/bin/bash

# Test script to verify frontend-backend-infra connectivity
# Usage: ./test-connectivity.sh <cluster-name> <service-name> <region>

set -e

CLUSTER_NAME=${1:-"arka-dev-cluster"}
SERVICE_NAME=${2:-"arka-dev-service"}
REGION=${3:-"us-east-1"}
CONTAINER_PORT=${4:-8080}

echo "========================================="
echo "Testing Arka Infrastructure Connectivity"
echo "========================================="
echo "Cluster: $CLUSTER_NAME"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
echo "🔍 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo ""

# Get running tasks
echo "🔍 Finding running ECS tasks..."
TASKS=$(aws ecs list-tasks \
    --cluster "$CLUSTER_NAME" \
    --service-name "$SERVICE_NAME" \
    --region "$REGION" \
    --query 'taskArns[]' \
    --output text)

if [ -z "$TASKS" ]; then
    echo "❌ No running tasks found. Is the service running?"
    exit 1
fi

TASK_COUNT=$(echo "$TASKS" | wc -w | tr -d ' ')
echo "✅ Found $TASK_COUNT running task(s)"
echo ""

# Get task details and IPs
echo "🔍 Getting task details..."
TASK_IPS=()
for TASK_ARN in $TASKS; do
    TASK_ID=$(basename "$TASK_ARN")
    echo "  Processing task: $TASK_ID"
    
    TASK_DETAILS=$(aws ecs describe-tasks \
        --cluster "$CLUSTER_NAME" \
        --tasks "$TASK_ARN" \
        --region "$REGION" \
        --query 'tasks[0]' \
        --output json)
    
    PUBLIC_IP=$(echo "$TASK_DETAILS" | jq -r '.attachments[0].details[] | select(.name=="networkInterfaceId") | .value' | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --region "$REGION" --query 'NetworkInterfaces[0].Association.PublicIp' --output text 2>/dev/null || echo "")
    
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
        TASK_IPS+=("$PUBLIC_IP")
        echo "    ✅ Public IP: $PUBLIC_IP"
    else
        echo "    ⚠️  No public IP found (task may still be starting)"
    fi
done

echo ""

if [ ${#TASK_IPS[@]} -eq 0 ]; then
    echo "❌ No public IPs found. Tasks may still be starting or not in public subnets."
    echo "   Wait a few minutes and try again."
    exit 1
fi

# Test connectivity
echo "🧪 Testing connectivity..."
SUCCESS_COUNT=0
FAIL_COUNT=0

for IP in "${TASK_IPS[@]}"; do
    URL="http://${IP}:${CONTAINER_PORT}"
    echo ""
    echo "Testing: $URL"
    
    # Test health endpoint
    if curl -s -f -m 5 "${URL}/actuator/health" > /dev/null 2>&1; then
        echo "  ✅ Health check: OK"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        
        # Test API endpoint
        if curl -s -f -m 5 "${URL}/api/v1/books" > /dev/null 2>&1; then
            echo "  ✅ API endpoint: OK"
        else
            echo "  ⚠️  API endpoint: Not responding (may be expected if no data)"
        fi
        
        # Test frontend
        if curl -s -f -m 5 "$URL" > /dev/null 2>&1; then
            echo "  ✅ Frontend: OK"
        else
            echo "  ⚠️  Frontend: Not responding"
        fi
        
        echo ""
        echo "📋 Access URLs:"
        echo "   Frontend: $URL"
        echo "   API: $URL/api/v1/books"
        echo "   Health: $URL/actuator/health"
    else
        echo "  ❌ Health check: FAILED"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
done

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "✅ Successful: $SUCCESS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo ""

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo "🎉 Infrastructure is accessible!"
    echo ""
    echo "To access your application, use one of these URLs:"
    for IP in "${TASK_IPS[@]}"; do
        echo "  http://${IP}:${CONTAINER_PORT}"
    done
    echo ""
    echo "Note: Task IPs change when tasks restart. For production, use an ALB."
else
    echo "❌ No accessible tasks found. Check:"
    echo "   1. Tasks are running (check ECS console)"
    echo "   2. Security group allows port $CONTAINER_PORT from 0.0.0.0/0"
    echo "   3. Tasks are in public subnets with public IPs"
    echo "   4. Application is listening on port $CONTAINER_PORT"
    exit 1
fi

