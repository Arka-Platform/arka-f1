output "vpc_id" {
  value       = module.network.vpc_id
  description = "ID of the created VPC"
}

output "private_subnet_ids" {
  value       = module.network.private_subnet_ids
  description = "Private subnets for ECS tasks"
}

output "public_subnet_ids" {
  value       = module.network.public_subnet_ids
  description = "Public subnets for load balancer"
}

# ALB Output - COMMENTED OUT
# output "alb_dns_name" {
#   value       = module.compute.alb_dns_name
#   description = "Application load balancer DNS"
# }

output "cluster_name" {
  value       = module.compute.cluster_name
  description = "ECS cluster name"
}

output "service_name" {
  value       = module.compute.service_name
  description = "ECS service name"
}

output "log_bucket_name" {
  value       = var.log_bucket_enabled ? module.storage.log_bucket_name : ""
  description = "S3 bucket storing logs"
}

output "app_storage_bucket_name" {
  value       = module.storage.app_storage_bucket_name
  description = "S3 bucket for application storage (uploads, assets, etc.)"
}

output "app_storage_bucket_arn" {
  value       = module.storage.app_storage_bucket_arn
  description = "ARN of application storage bucket"
}

# Database Outputs
output "database_cluster_endpoint" {
  description = "RDS Aurora cluster endpoint (writer endpoint)"
  value       = module.database.cluster_endpoint
  sensitive   = false
}

output "database_cluster_reader_endpoint" {
  description = "RDS Aurora cluster reader endpoint (for read replicas)"
  value       = module.database.cluster_reader_endpoint
  sensitive   = false
}

output "database_name" {
  description = "Name of the default database"
  value       = module.database.database_name
}

output "database_security_group_id" {
  description = "Security group ID for RDS cluster"
  value       = module.database.security_group_id
}

