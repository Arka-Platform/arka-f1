# GitHub Repository Setup Guide

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `arka-platform-git`
3. Description: "Arka Platform - Book Marketplace with Frontend, Backend, and Infrastructure"
4. Visibility: Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Add Remote and Push

After creating the repository, run these commands:

```bash
cd /Users/sharvani/Desktop/arka-f1

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/arka-platform-git.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/arka-platform-git.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Configure GitHub Actions Secrets

### For Simple Setup (Using Access Keys):

1. **Create IAM User:**
   ```bash
   aws iam create-user --user-name github-actions-ecr
   
   aws iam attach-user-policy \
     --user-name github-actions-ecr \
     --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess
   
   # Create access keys
   aws iam create-access-key --user-name github-actions-ecr
   ```

2. **Add Secrets to GitHub:**
   - Go to: `https://github.com/YOUR_USERNAME/arka-platform-git/settings/secrets/actions`
   - Click "New repository secret"
   - Add:
     - Name: `AWS_ACCESS_KEY_ID`
     - Value: Your access key ID
   - Add another:
     - Name: `AWS_SECRET_ACCESS_KEY`
     - Value: Your secret access key

## Step 4: Test GitHub Actions

1. Make a small change to trigger the workflow:
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "Test GitHub Actions"
   git push
   ```

2. Check Actions tab:
   - Go to: `https://github.com/YOUR_USERNAME/arka-platform-git/actions`
   - You should see the workflow running
   - Wait for it to complete (builds Docker image and pushes to ECR)

## Step 5: Verify ECR Image

After workflow completes:

```bash
# List images in ECR
aws ecr describe-images \
  --repository-name arka-app \
  --region us-east-1
```

You should see the image with tags:
- `latest`
- Commit SHA (e.g., `abc123def456...`)

## Step 6: Use Image in Terraform

Update your `terraform.tfvars`:

```hcl
container_image = "934189896155.dkr.ecr.us-east-1.amazonaws.com/arka-app:latest"
```

Or use a specific commit:
```hcl
container_image = "934189896155.dkr.ecr.us-east-1.amazonaws.com/arka-app:<commit-sha>"
```

## Workflow Details

The GitHub Actions workflow (`deploy-to-ecr-simple.yml`) will:

1. **Trigger on:**
   - Push to `main` or `master` branch
   - Changes to `frontend/`, `arka-backend/`, or `Dockerfile`
   - Manual trigger (workflow_dispatch)

2. **Build Process:**
   - Checkout code
   - Configure AWS credentials
   - Login to ECR
   - Build Docker image (multi-stage: frontend → backend → runtime)
   - Tag with commit SHA and `latest`
   - Push to ECR

3. **Output:**
   - Image URI for use in Terraform

## Troubleshooting

### Workflow Fails: "Access Denied"
- Check IAM user has ECR permissions
- Verify secrets are set correctly in GitHub
- Check AWS account ID matches (934189896155)

### Workflow Fails: "Repository not found"
- Create ECR repository manually:
  ```bash
  aws ecr create-repository --repository-name arka-app --region us-east-1
  ```

### Image Not Found After Push
- Check ECR region matches (us-east-1)
- Verify image tags in ECR console
- Check workflow logs for errors

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Configure GitHub Actions secrets
3. ✅ Test workflow
4. ✅ Deploy infrastructure with Terraform using ECR image
5. 🔄 Set up automated deployments (optional)

