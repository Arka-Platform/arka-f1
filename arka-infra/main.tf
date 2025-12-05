terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name_prefix = "${var.project}-${var.environment}"
}

# Generate random password for database if not provided
resource "random_password" "database_password" {
  length  = 32
  special = true
  # Exclude characters that might cause issues in connection strings
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Use provided password or generated random password
locals {
  database_password = var.database_master_password != "" ? var.database_master_password : random_password.database_password.result
}

module "ecr" {
  source = "./modules/ecr"

  project     = var.project
  environment = var.environment
}

module "network" {
  source = "./modules/network"

  project              = var.project
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "storage" {
  source = "./modules/storage"

  project            = var.project
  environment        = var.environment
  log_bucket_enabled = var.log_bucket_enabled
  log_bucket_name    = "${local.name_prefix}-logs"

  app_storage_bucket_enabled                     = var.app_storage_bucket_enabled
  app_storage_bucket_name                        = var.app_storage_bucket_name != "" ? var.app_storage_bucket_name : "${local.name_prefix}-storage"
  app_storage_versioning_enabled                 = var.app_storage_versioning_enabled
  app_storage_encryption_algorithm               = var.app_storage_encryption_algorithm
  app_storage_lifecycle_enabled                  = var.app_storage_lifecycle_enabled
  app_storage_ia_transition_days                 = var.app_storage_ia_transition_days
  app_storage_glacier_transition_enabled         = var.app_storage_glacier_transition_enabled
  app_storage_glacier_transition_days            = var.app_storage_glacier_transition_days
  app_storage_version_expiration_days            = var.app_storage_version_expiration_days
  app_storage_noncurrent_version_expiration_days = var.app_storage_noncurrent_version_expiration_days
}

module "identity" {
  source = "./modules/identity"

  project     = var.project
  environment = var.environment
  ecs_task_execution_policies = [
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
  ]
}

module "observability" {
  source = "./modules/observability"

  project           = var.project
  environment       = var.environment
  retention_in_days = var.log_retention_in_days
}

module "compute" {
  source = "./modules/compute"

  project                     = var.project
  environment                 = var.environment
  vpc_id                      = module.network.vpc_id
  private_subnet_ids          = module.network.private_subnet_ids
  public_subnet_ids           = module.network.public_subnet_ids
  ecs_task_execution_role_arn = module.identity.ecs_task_execution_role_arn
  ecs_task_role_arn           = module.identity.ecs_task_role_arn
  container_image             = var.container_image != "" ? var.container_image : "${module.ecr.repository_url}:latest"
  container_port              = var.container_port
  desired_count               = var.desired_count
  cpu                         = var.fargate_cpu
  memory                      = var.fargate_memory
  log_group_name              = module.observability.log_group_name
  log_bucket_arn              = var.log_bucket_enabled ? module.storage.log_bucket_arn : ""
  log_bucket_name             = var.log_bucket_enabled ? module.storage.log_bucket_name : ""
  health_check_path           = var.health_check_path
  database_endpoint           = module.database.cluster_endpoint
  database_name               = var.database_name
  database_username           = var.database_master_username
  database_password           = local.database_password
  frontend_url                = var.frontend_url != "" ? var.frontend_url : module.frontend.frontend_url
}

module "database" {
  source = "./modules/database"

  project            = var.project
  environment        = var.environment
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  # Note: allowed_security_group_ids removed - using separate security group rule instead

  database_name                = var.database_name
  master_username              = var.database_master_username
  master_password              = local.database_password
  engine_version               = var.database_engine_version
  instance_class               = var.database_instance_class
  allocated_storage            = var.database_allocated_storage
  max_allocated_storage        = var.database_max_allocated_storage
  backup_retention_period      = var.database_backup_retention_period
  preferred_backup_window      = var.database_preferred_backup_window
  preferred_maintenance_window = var.database_preferred_maintenance_window
  skip_final_snapshot          = var.database_skip_final_snapshot
  deletion_protection          = var.database_deletion_protection
  cloudwatch_logs_exports      = var.database_cloudwatch_logs_exports
  kms_key_id                   = var.database_kms_key_id
  multi_az                     = var.database_multi_az
}

module "frontend" {
  source = "./modules/frontend"

  project           = var.project
  environment       = var.environment
  domain_name       = var.frontend_domain_name
  certificate_arn   = var.frontend_certificate_arn
  enable_cloudfront = var.frontend_enable_cloudfront
}

# Security group rule to allow ECS tasks to access RDS
# Created separately to avoid circular dependency
resource "aws_security_group_rule" "rds_ingress_from_ecs" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = module.compute.service_security_group_id
  security_group_id        = module.database.security_group_id
  description              = "PostgreSQL from ECS service"
}

output "service_security_group_id" {
  value       = module.compute.service_security_group_id
  description = "Security group protecting ECS service"
}
