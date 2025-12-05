variable "project" {
  description = "Project name used for tagging and resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where RDS cluster will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for RDS subnet group"
  type        = list(string)
}

# Note: Security group rules are created separately in main.tf to avoid circular dependencies

variable "database_name" {
  description = "Name of the default database to create"
  type        = string
  default     = "arka"
}

variable "master_username" {
  description = "Master username for the database"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "master_password" {
  description = "Master password for the database. Should be provided via environment variable or secrets manager"
  type        = string
  sensitive   = true
}

variable "engine_version" {
  description = "PostgreSQL engine version (use available version like 15.3 or 14.10)"
  type        = string
  default     = "15.3"  # Updated to available version
}

variable "instance_class" {
  description = "Instance class for RDS instance (Free Tier: db.t3.micro or db.t4g.micro)"
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB (Free Tier: up to 20 GB)"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling (0 to disable)"
  type        = number
  default     = 0
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment (not available in Free Tier)"
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Preferred backup window (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "preferred_maintenance_window" {
  description = "Preferred maintenance window (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when deleting cluster (use false for production)"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection (use true for production)"
  type        = bool
  default     = true
}

variable "cloudwatch_logs_exports" {
  description = "List of log types to export to CloudWatch"
  type        = list(string)
  default     = ["postgresql"]
}

variable "kms_key_id" {
  description = "KMS key ID for encryption (optional, uses default if not provided)"
  type        = string
  default     = ""
}

# Removed serverless variables - using regular RDS PostgreSQL instead

