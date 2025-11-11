# GitHub Actions Setup for ECR Deployment

## Setup Instructions

### Option 1: Using AWS Access Keys (Simpler - Recommended for Start)

1. **Create IAM User with ECR Permissions:**
   ```bash
   # Create IAM user
   aws iam create-user --user-name github-actions-ecr
   
   # Attach ECR policy
   aws iam attach-user-policy \
     --user-name github-actions-ecr \
     --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess
   ```

2. **Create Access Keys:**
   ```bash
   aws iam create-access-key --user-name github-actions-ecr
   ```
   Save the Access Key ID and Secret Access Key.

3. **Add Secrets to GitHub:**
   - Go to your repository: `https://github.com/YOUR_USERNAME/arka-platform-git`
   - Settings → Secrets and variables → Actions
   - Add these secrets:
     - `AWS_ACCESS_KEY_ID`: Your access key ID
     - `AWS_SECRET_ACCESS_KEY`: Your secret access key

4. **Use the Simple Workflow:**
   - The workflow file `deploy-to-ecr-simple.yml` will be used automatically
   - It uses the secrets you just added

### Option 2: Using IAM Role (More Secure - For Production)

1. **Create OIDC Provider in AWS:**
   ```bash
   aws iam create-open-id-connect-provider \
     --url https://token.actions.githubusercontent.com \
     --client-id-list sts.amazonaws.com \
     --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
   ```

2. **Create IAM Role:**
   ```bash
   # Create trust policy
   cat > trust-policy.json <<EOF
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::934189896155:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:sub": "repo:YOUR_USERNAME/arka-platform-git:*"
           }
         }
       }
     ]
   }
   EOF
   
   # Create role
   aws iam create-role \
     --role-name github-actions-ecr-role \
     --assume-role-policy-document file://trust-policy.json
   
   # Attach ECR policy
   aws iam attach-role-policy \
     --role-name github-actions-ecr-role \
     --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess
   ```

3. **Update workflow file:**
   - Use `deploy-to-ecr.yml` (the one with OIDC)
   - Update the role ARN in the workflow file

## Workflow Files

- **`deploy-to-ecr-simple.yml`**: Uses AWS access keys (easier setup)
- **`deploy-to-ecr.yml`**: Uses IAM role with OIDC (more secure)

## How It Works

1. **Trigger**: Workflow runs on push to main/master or manual trigger
2. **Build**: Builds Docker image from Dockerfile
3. **Tag**: Tags image with commit SHA and `latest`
4. **Push**: Pushes to ECR repository `arka-app`
5. **Output**: Provides image URI for Terraform deployment

## Image URI Format

After successful build, use this image URI in Terraform:
```
934189896155.dkr.ecr.us-east-1.amazonaws.com/arka-app:latest
```

## Manual Trigger

You can manually trigger the workflow:
1. Go to Actions tab in GitHub
2. Select "Build and Push to ECR"
3. Click "Run workflow"

