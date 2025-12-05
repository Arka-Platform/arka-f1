resource "aws_s3_bucket" "logs" {
  count = var.log_bucket_enabled ? 1 : 0

  bucket = var.log_bucket_name
  force_destroy = false

  tags = {
    Name        = var.log_bucket_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "logs" {
  count  = var.log_bucket_enabled ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  count  = var.log_bucket_enabled ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  count                   = var.log_bucket_enabled ? 1 : 0
  bucket                  = aws_s3_bucket.logs[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for ALB access logs
data "aws_elb_service_account" "main" {
  count = var.log_bucket_enabled ? 1 : 0
}

data "aws_caller_identity" "current" {
  count = var.log_bucket_enabled ? 1 : 0
}

data "aws_region" "current" {
  count = var.log_bucket_enabled ? 1 : 0
}

resource "aws_s3_bucket_policy" "logs" {
  count  = var.log_bucket_enabled ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main[0].arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs[0].arn}/*"
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs[0].arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs[0].arn
      }
    ]
  })
}

# Application storage bucket for future use (uploads, assets, etc.)
resource "aws_s3_bucket" "app_storage" {
  count  = var.app_storage_bucket_enabled ? 1 : 0
  bucket = var.app_storage_bucket_name

  tags = {
    Name        = var.app_storage_bucket_name
    Environment = var.environment
    Purpose     = "application-storage"
  }
}

resource "aws_s3_bucket_versioning" "app_storage" {
  count  = var.app_storage_bucket_enabled ? 1 : 0
  bucket = aws_s3_bucket.app_storage[0].id
  versioning_configuration {
    status = var.app_storage_versioning_enabled ? "Enabled" : "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_storage" {
  count  = var.app_storage_bucket_enabled ? 1 : 0
  bucket = aws_s3_bucket.app_storage[0].id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = var.app_storage_encryption_algorithm
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_storage" {
  count                   = var.app_storage_bucket_enabled ? 1 : 0
  bucket                  = aws_s3_bucket.app_storage[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "app_storage" {
  count  = var.app_storage_bucket_enabled && var.app_storage_lifecycle_enabled ? 1 : 0
  bucket = aws_s3_bucket.app_storage[0].id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    filter {}

    transition {
      days          = var.app_storage_ia_transition_days
      storage_class = "STANDARD_IA"
    }
  }

  rule {
    id     = "transition-to-glacier"
    status = var.app_storage_glacier_transition_enabled ? "Enabled" : "Disabled"

    filter {}

    transition {
      days          = var.app_storage_glacier_transition_days
      storage_class = "GLACIER"
    }
  }

  rule {
    id     = "expire-old-versions"
    status = var.app_storage_versioning_enabled ? "Enabled" : "Disabled"

    filter {}

    expiration {
      days = var.app_storage_version_expiration_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.app_storage_noncurrent_version_expiration_days
    }
  }
}

