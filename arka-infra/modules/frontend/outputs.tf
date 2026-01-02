output "bucket_name" {
  description = "Name of the S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.frontend[0].id : ""
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.frontend[0].domain_name : ""
}

output "cloudfront_arn" {
  description = "CloudFront distribution ARN"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.frontend[0].arn : ""
}

output "frontend_url" {
  description = "Frontend URL (CloudFront if enabled, otherwise S3 website endpoint)"
  value = var.enable_cloudfront ? (
    var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.frontend[0].domain_name}"
  ) : "http://${aws_s3_bucket.frontend.bucket}.s3-website-${data.aws_region.current.name}.amazonaws.com"
}

data "aws_region" "current" {}








