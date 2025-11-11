# ALB Commented Out - Direct Access Configuration

## Changes Made

### ✅ ALB Resources Commented Out
- Application Load Balancer (ALB)
- Target Group
- ALB Listener
- ALB Security Group

### ✅ ECS Service Updated for Direct Access
- **Public Subnets**: Tasks now run in public subnets (was private)
- **Public IP**: `assign_public_ip = true` (was false)
- **Security Group**: Allows direct internet access on port 8080
- **Load Balancer Config**: Removed (no ALB dependency)

### ✅ Outputs Updated
- ALB DNS output commented out
- Added cluster name, service name outputs
- Added instructions for getting task IPs

## Architecture Change

### Before (with ALB):
```
Internet → ALB → ECS Tasks (private subnets)
```

### After (direct access):
```
Internet → ECS Tasks (public subnets, public IPs)
```

## How to Deploy and Test

### Quick Deploy (Recommended)
```bash
cd arka-infra
./quick-deploy.sh
```

This script will:
1. Build and push Docker image to ECR
2. Generate database password
3. Create terraform.tfvars
4. Initialize and deploy infrastructure
5. Show next steps

### Manual Deploy

1. **Build and push image:**
   ```bash
   cd /Users/sharvani/Desktop/arka-f1
   docker build -t arka-app:latest .
   
   AWS_ACCOUNT=934189896155
   AWS_REGION=us-east-1
   aws ecr get-login-password --region $AWS_REGION | \
     docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com
   
   aws ecr create-repository --repository-name arka-app --region $AWS_REGION 2>/dev/null || true
   
   docker tag arka-app:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/arka-app:latest
   docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/arka-app:latest
   ```

2. **Deploy infrastructure:**
   ```bash
   cd arka-infra
   terraform init
   terraform apply -var-file=terraform.tfvars
   ```

3. **Get task IPs and test:**
   ```bash
   ./test-connectivity.sh
   ```

## Testing Connectivity

### Option 1: Use Test Script
```bash
./test-connectivity.sh <cluster-name> <service-name> <region>
```

### Option 2: Manual Testing

1. **Get running tasks:**
   ```bash
   CLUSTER="arka-dev-cluster"
   SERVICE="arka-dev-service"
   
   aws ecs list-tasks --cluster $CLUSTER --service-name $SERVICE
   ```

2. **Get task public IP:**
   ```bash
   TASK_ARN="<task-arn-from-above>"
   
   # Get network interface
   NETWORK_ID=$(aws ecs describe-tasks \
     --cluster $CLUSTER \
     --tasks $TASK_ARN \
     --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
     --output text)
   
   # Get public IP
   PUBLIC_IP=$(aws ec2 describe-network-interfaces \
     --network-interface-ids $NETWORK_ID \
     --query 'NetworkInterfaces[0].Association.PublicIp' \
     --output text)
   
   echo "Public IP: $PUBLIC_IP"
   ```

3. **Test endpoints:**
   ```bash
   # Health check
   curl http://$PUBLIC_IP:8080/actuator/health
   
   # Frontend
   curl http://$PUBLIC_IP:8080/
   
   # API
   curl http://$PUBLIC_IP:8080/api/v1/books
   ```

4. **Open in browser:**
   ```
   http://<PUBLIC_IP>:8080
   ```

## Important Notes

### ⚠️ Security Considerations
- **Direct public access**: Tasks are directly accessible from internet
- **No HTTPS**: Only HTTP (port 8080)
- **For testing only**: This configuration is NOT production-ready
- **Re-enable ALB**: For production, uncomment ALB resources

### 📝 Task IPs are Dynamic
- Task IPs change when tasks restart
- No fixed endpoint (unlike ALB DNS)
- Use ECS console or CLI to get current IPs

### 🔄 Re-enabling ALB

To restore ALB configuration:

1. Uncomment ALB resources in `modules/compute/main.tf`
2. Update security group to use ALB security group reference
3. Change ECS service back to private subnets
4. Set `assign_public_ip = false`
5. Re-add load balancer configuration
6. Run `terraform apply`

## Frontend-Backend Connection

### Current Setup
- Frontend is built into backend (monolithic container)
- Both served from same port (8080)
- No CORS issues (same origin)
- API calls use relative URLs (`/api/v1/*`)

### Testing Frontend
1. Open `http://<PUBLIC_IP>:8080` in browser
2. React app should load
3. Navigate to different pages
4. Check browser console for errors

### Testing Backend API
1. Use curl or Postman
2. Test endpoints:
   - `GET /api/v1/books` - List books
   - `POST /api/v1/books` - Create book
   - `GET /actuator/health` - Health check

### Database Connection
- RDS Aurora PostgreSQL is automatically connected
- Connection string configured via environment variables
- Check application logs for connection status:
  ```bash
  aws logs tail /ecs/arka/dev --follow
  ```

## Troubleshooting

### Tasks Not Starting
- Check ECS console for task status
- Review CloudWatch logs
- Verify image exists in ECR
- Check IAM permissions

### Cannot Access Application
- Verify security group allows port 8080 from 0.0.0.0/0
- Check tasks are in public subnets
- Verify `assign_public_ip = true`
- Wait 2-3 minutes for tasks to fully start

### Database Connection Issues
- Check database endpoint: `terraform output database_cluster_endpoint`
- Verify security group allows ECS service security group
- Check database credentials in application logs
- Ensure database is in same VPC

## Next Steps

1. ✅ **Test connectivity** - Verify frontend and backend work
2. ✅ **Test database** - Create/read data via API
3. 🔄 **Re-enable ALB** - For production use
4. 🔒 **Add HTTPS** - With ACM certificate
5. 📊 **Add monitoring** - CloudWatch alarms and dashboards
6. 🔄 **Enable auto-scaling** - For variable traffic

## Files Modified

- `modules/compute/main.tf` - ALB commented out, ECS service updated
- `modules/compute/outputs.tf` - ALB output commented, new outputs added
- `outputs.tf` - ALB output commented
- `test-connectivity.sh` - New test script
- `quick-deploy.sh` - New deployment script
- `DEPLOY_AND_TEST.md` - Deployment guide

