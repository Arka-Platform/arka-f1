# GitHub Repository Setup Guide

## Step 1: Create GitHub Repository in Arka-Platform Organization

1. Go to https://github.com/organizations/Arka-Platform/repositories/new
   - Or go to https://github.com/new and select "Arka-Platform" as the owner
2. Repository name: Choose your repository name (e.g., `arka-platform`, `arka-f1`, etc.)
3. Description: "Arka Platform - Book Marketplace with Frontend, Backend, and Infrastructure"
4. Visibility: Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Add Remote and Push

After creating the repository, set up the remote and push:

```bash
cd /Users/sharvani/Desktop/arka-f1

# Use the setup script (it will prompt for repository name)
./setup-github-repo.sh --push

# Or manually (replace REPO_NAME with your actual repository name):
# git remote add origin https://github.com/Arka-Platform/REPO_NAME.git
# git branch -M main
# git push -u origin main
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

2. **Add Variables to GitHub:**
   - Go to: `https://github.com/Arka-Platform/YOUR_REPO_NAME/settings/secrets/actions`
   - Replace `YOUR_REPO_NAME` with your actual repository name
   - Click on the "Variables" tab (not "Secrets")
   - Click "New repository variable"
   - Add:
     - Name: `AWS_ACCESS_KEY_ID`
     - Value: Your access key ID
   - Add another:
     - Name: `AWS_SECRET_ACCESS_KEY`
     - Value: Your secret access key
   
   **Note:** The workflow uses variables (`vars`) instead of secrets. Variables are visible in logs (masked), while secrets are completely hidden.

## Step 4: Test GitHub Actions

1. Make a small change to trigger the workflow:
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "Test GitHub Actions"
   git push
   ```

2. Check Actions tab:
   - Go to: `https://github.com/Arka-Platform/YOUR_REPO_NAME/actions`
   - Replace `YOUR_REPO_NAME` with your actual repository name
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
