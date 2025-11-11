variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "log_bucket_enabled" {
  type = bool
}

variable "log_bucket_name" {
  type = string
}

variable "app_storage_bucket_enabled" {
  description = "Whether to create an S3 bucket for application storage (uploads, assets, etc.)"
  type        = bool
  default     = true
}

variable "app_storage_bucket_name" {
  description = "Name of the application storage S3 bucket"
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

