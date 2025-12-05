variable "project" {
  description = "Project name used for tagging and resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.10.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.10.0.0/24", "10.10.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.10.10.0/24", "10.10.11.0/24"]
}

variable "container_image" {
  description = "Container image for ECS service (e.g., ECR URI or Docker Hub image). If empty, uses ECR repository URL with :latest tag"
  type        = string
  default     = ""
}

variable "frontend_url" {
  description = "Frontend URL for CORS configuration in backend (if not set, will use CloudFront URL from frontend module)"
  type        = string
  default     = ""
}

variable "frontend_domain_name" {
  description = "Custom domain name for frontend CloudFront distribution (optional)"
  type        = string
  default     = ""
}

variable "frontend_certificate_arn" {
  description = "ACM certificate ARN for frontend custom domain (required if frontend_domain_name is set)"
  type        = string
  default     = ""
}

variable "frontend_enable_cloudfront" {
  description = "Enable CloudFront distribution for frontend"
  type        = bool
  default     = true
}

variable "container_port" {
  description = "Container port exposed by the application"
  type        = number
  default     = 8080
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "fargate_cpu" {
  description = "Fargate task CPU units"
  type        = number
  default     = 512
}

variable "fargate_memory" {
  description = "Fargate task memory in MiB"
  type        = number
  default     = 1024
}

variable "log_retention_in_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "log_bucket_enabled" {
  description = "Whether to provision an S3 bucket for ALB / application logs"
  type        = bool
  default     = true
}

variable "health_check_path" {
  description = "HTTP path for ALB health checks"
  type        = string
  default     = "/health"
}

# Database (RDS Aurora PostgreSQL) Variables
variable "database_name" {
  description = "Name of the default database to create"
  type        = string
  default     = "arka"
}

variable "database_master_username" {
  description = "Master username for the database"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "database_master_password" {
  description = "Master password for the database. If not provided, a random password will be generated automatically"
  type        = string
  sensitive   = true
  default     = "" # Empty string means generate random password
}

variable "database_engine_version" {
  description = "PostgreSQL engine version (leave empty for default, or use 14.10, 15.2, etc.)"
  type        = string
  default     = ""  # Empty string uses AWS default
}

variable "database_instance_class" {
  description = "Instance class for RDS instance (Free Tier: db.t3.micro or db.t4g.micro, standard: db.t4g.medium)"
  type        = string
  default     = "db.t4g.micro"  # Free Tier compatible
}

variable "database_allocated_storage" {
  description = "Allocated storage in GB (Free Tier: up to 20 GB)"
  type        = number
  default     = 20
}

variable "database_max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling (0 to disable, Free Tier: 0)"
  type        = number
  default     = 0
}

variable "database_multi_az" {
  description = "Enable Multi-AZ deployment (not available in Free Tier)"
  type        = bool
  default     = false
}

variable "database_backup_retention_period" {
  description = "Number of days to retain backups (Free Tier limit: 1 day, standard: up to 35 days)"
  type        = number
  default     = 1 # Set to 1 for Free Tier compatibility
}

variable "database_preferred_backup_window" {
  description = "Preferred backup window (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "database_preferred_maintenance_window" {
  description = "Preferred maintenance window (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "database_skip_final_snapshot" {
  description = "Skip final snapshot when deleting cluster (use false for production)"
  type        = bool
  default     = false
}

variable "database_deletion_protection" {
  description = "Enable deletion protection (use true for production)"
  type        = bool
  default     = true
}

variable "database_cloudwatch_logs_exports" {
  description = "List of log types to export to CloudWatch"
  type        = list(string)
  default     = ["postgresql"]
}

variable "database_kms_key_id" {
  description = "KMS key ID for encryption (optional, uses default if not provided)"
  type        = string
  default     = ""
}

# Removed serverless variables - using regular RDS PostgreSQL instead

# Application Storage S3 Variables
variable "app_storage_bucket_enabled" {
  description = "Whether to create an S3 bucket for application storage (uploads, assets, etc.)"
  type        = bool
  default     = true
}

variable "app_storage_bucket_name" {
  description = "Name of the application storage S3 bucket (empty = auto-generated)"
  type        = string
  default     = ""
}

variable "app_storage_versioning_enabled" {
  description = "Enable versioning on application storage bucket"
  type        = bool
  default     = true
}

variable "app_storage_encryption_algorithm" {
  description = "Encryption algorithm for application storage bucket (AES256 or aws:kms)"
  type        = string
  default     = "AES256"
}

variable "app_storage_lifecycle_enabled" {
  description = "Enable lifecycle policies for application storage bucket"
  type        = bool
  default     = false
}

variable "app_storage_ia_transition_days" {
  description = "Days before transitioning to Infrequent Access storage class"
  type        = number
  default     = 90
}

variable "app_storage_glacier_transition_enabled" {
  description = "Enable transition to Glacier storage class"
  type        = bool
  default     = false
}

variable "app_storage_glacier_transition_days" {
  description = "Days before transitioning to Glacier storage class"
  type        = number
  default     = 180
}

variable "app_storage_version_expiration_days" {
  description = "Days before expiring old object versions"
  type        = number
  default     = 365
}

variable "app_storage_noncurrent_version_expiration_days" {
  description = "Days before expiring non-current object versions"
  type        = number
  default     = 90
}

