# Arka Infrastructure (Terraform)

This directory contains Terraform code to provision the infrastructure for running the Arka platform on AWS ECS Fargate. The configuration follows a modular approach and can be reused across environments (dev/staging/prod) by switching variable values.

## Structure

```
arka-infra/
├── main.tf           # Root module wiring sub-modules
├── variables.tf      # Input variables
├── outputs.tf        # Exported values
├── modules/
│   ├── network/      # VPC, subnets, routing, NAT
│   ├── storage/      # Optional S3 log bucket
│   ├── identity/     # IAM roles for ECS
│   ├── observability/# CloudWatch log group etc.
│   └── compute/      # ECS cluster, ALB, service/task definition
```

## Prerequisites
- Terraform >= 1.6
- AWS credentials with permissions to create networking, IAM, ECS, S3, and CloudWatch resources
- An application container image (e.g., uploaded to ECR) for the backend + frontend combined image built from the monorepo `Dockerfile`

## Usage

```
cd arka-infra
terraform init
terraform plan -var='project=arka' -var='environment=dev' -var='container_image=123456789012.dkr.ecr.us-east-1.amazonaws.com/arka-app:latest'
terraform apply -var='project=arka' -var='environment=dev' -var='container_image=123456789012.dkr.ecr.us-east-1.amazonaws.com/arka-app:latest'
```

### Important Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `project` | Project name used for tagging | n/a |
| `environment` | Environment (dev/staging/prod) | n/a |
| `aws_region` | AWS region | `us-east-1` |
| `container_image` | ECS task container image | n/a |
| `desired_count` | ECS tasks | `2` |
| `fargate_cpu`/`fargate_memory` | CPU/Memory (512/1024) | defaults |
| `log_bucket_enabled` | Provision S3 access-log bucket | `true` |

See `variables.tf` for full list.

## Modules Overview
- **network**: Creates VPC, public/private subnets, internet/NAT gateways, route tables.
- **storage**: Optional S3 bucket for ALB/application logs (encrypted, versioned).
- **identity**: IAM execution role & task role for ECS.
- **observability**: CloudWatch log group for ECS tasks.
- **compute**: ECS cluster, Fargate service, task definition, ALB, security groups.

## Post-Deployment
- ALB DNS is exported as `alb_dns_name` for application access.
- Security group IDs and subnet IDs are available via outputs for further integrations (e.g., RDS, Redis).

## Remote State
Configure an S3/DynamoDB backend (not included by default) before production use:
```
terraform {
  backend "s3" {
    bucket         = "arka-terraform-state"
    key            = "${var.environment}/ecs/terraform.tfstate"
    region         = var.aws_region
    dynamodb_table = "arka-terraform-locks"
    encrypt        = true
  }
}
```

## Next Steps
- Integrate RDS/ElastiCache modules as the application evolves.
- Add WAF and ACM/HTTPS listeners to the ALB for production.
- Expand IAM policies for secrets access (SSM Parameter Store/Secrets Manager).
- Wire CI/CD to build the container, push to ECR, and run `terraform apply`.

