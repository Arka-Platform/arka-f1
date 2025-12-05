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

# ALB Output
output "alb_dns_name" {
  value       = module.compute.alb_dns_name
  description = "Application load balancer DNS name - use this URL to access both frontend and backend (frontend at root, API at /api)"
}

output "alb_arn" {
  value       = module.compute.alb_arn
  description = "Application load balancer ARN"
}

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

output "database_master_password" {
  description = "Database master password (randomly generated if not provided). SAVE THIS SECURELY!"
  value       = local.database_password
  sensitive   = true
}

# ECR Outputs
output "ecr_repository_url" {
  description = "ECR repository URL for pushing container images"
  value       = module.ecr.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name"
  value       = module.ecr.repository_name
}

# Service endpoint information
output "service_endpoint_info" {
  description = "Information about how to access the application"
  value = {
    cluster_name = module.compute.cluster_name
    service_name = module.compute.service_name
    alb_dns_name = module.compute.alb_dns_name
    frontend_url = "http://${module.compute.alb_dns_name}"
    backend_url  = "http://${module.compute.alb_dns_name}/api"
    note         = "Both frontend and backend are served from the same ALB. Frontend at root, API at /api"
  }
}

# Frontend Outputs (served from ALB via backend static files)
output "frontend_url" {
  description = "Frontend URL (served from ALB via backend static files)"
  value       = "http://${module.compute.alb_dns_name}"
}

# Frontend module outputs commented out - using ALB instead
# output "frontend_bucket_name" {
#   description = "S3 bucket name for frontend static files"
#   value       = module.frontend.bucket_name
# }
#
# output "frontend_bucket_arn" {
#   description = "ARN of frontend S3 bucket"
#   value       = module.frontend.bucket_arn
# }
#
# output "frontend_cloudfront_distribution_id" {
#   description = "CloudFront distribution ID for frontend"
#   value       = module.frontend.cloudfront_distribution_id
# }
#
# output "frontend_cloudfront_domain_name" {
#   description = "CloudFront distribution domain name for frontend"
#   value       = module.frontend.cloudfront_domain_name
# }

