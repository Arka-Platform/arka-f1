output "log_bucket_name" {
  value       = var.log_bucket_enabled ? aws_s3_bucket.logs[0].bucket : ""
  description = "S3 bucket storing application/alb logs"
}

output "log_bucket_arn" {
  value       = var.log_bucket_enabled ? aws_s3_bucket.logs[0].arn : ""
  description = "ARN of log bucket"
}

output "app_storage_bucket_name" {
  value       = var.app_storage_bucket_enabled ? aws_s3_bucket.app_storage[0].bucket : ""
  description = "S3 bucket for application storage (uploads, assets, etc.)"
}

output "app_storage_bucket_arn" {
  value       = var.app_storage_bucket_enabled ? aws_s3_bucket.app_storage[0].arn : ""
  description = "ARN of application storage bucket"
}
