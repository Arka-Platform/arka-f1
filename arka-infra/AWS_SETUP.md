# AWS Credentials Setup

## Error: Invalid Security Token

If you're seeing this error:
```
Error: Retrieving AWS account details: validating provider credentials: retrieving caller identity from STS: operation error STS: GetCallerIdentity, https response error StatusCode: 403, RequestID: ..., api error InvalidClientTokenId: The security token included in the request is invalid.
```

This means your AWS credentials are not configured or are invalid.

## Setup AWS Credentials

### Option 1: AWS CLI Configuration (Recommended)

1. **Install AWS CLI** (if not already installed):
   ```bash
   # macOS
   brew install awscli
   
   # Or using pip
   pip install awscli
   ```

2. **Configure AWS credentials**:
   ```bash
   aws configure
   ```
   
   You'll be prompted for:
   - **AWS Access Key ID**: Your access key
   - **AWS Secret Access Key**: Your secret key
   - **Default region name**: `us-east-1` (or your preferred region)
   - **Default output format**: `json`

3. **Verify credentials**:
   ```bash
   aws sts get-caller-identity
   ```
   
   This should return your AWS account ID and user information.

### Option 2: Environment Variables

Set these environment variables:

```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_DEFAULT_REGION="us-east-1"
```

### Option 3: AWS Profiles

If you have multiple AWS accounts, use profiles:

```bash
# Configure a profile
aws configure --profile arka

# Use the profile
export AWS_PROFILE=arka
```

Or set in `terraform.tfvars` or use `-var` flag (not recommended for credentials).

## Getting AWS Credentials

1. **Sign in to AWS Console**: https://console.aws.amazon.com/
2. **Go to IAM**: https://console.aws.amazon.com/iam/
3. **Users** → Select your user → **Security credentials** tab
4. **Create access key** → Choose "Command Line Interface (CLI)"
5. **Download or copy** the Access Key ID and Secret Access Key

⚠️ **Important**: Keep your credentials secure! Never commit them to version control.

## Verify Setup

After configuring credentials, verify:

```bash
# Check AWS account
aws sts get-caller-identity

# Should show:
# {
#     "UserId": "...",
#     "Account": "600751737236",
#     "Arn": "..."
# }
```

## Troubleshooting

### Still getting 403 errors?

1. **Check IAM permissions**: Your user needs permissions to create resources
2. **Check account ID**: Verify you're using the correct AWS account (600751737236)
3. **Check region**: Ensure the region matches your terraform configuration
4. **Check credentials**: Verify credentials are not expired

### Required IAM Permissions

Your AWS user/role needs permissions for:
- EC2 (VPC, subnets, security groups, network interfaces)
- ECS (clusters, services, task definitions)
- RDS (Aurora clusters, instances)
- S3 (buckets, policies)
- CloudFront (distributions)
- IAM (roles, policies)
- CloudWatch (log groups)
- ECR (repositories)

Minimum required policy: `AdministratorAccess` (for development) or create a custom policy with the above permissions.

## Next Steps

Once credentials are configured:

```bash
cd arka-infra
terraform init
terraform plan
```



