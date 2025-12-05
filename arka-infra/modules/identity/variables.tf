variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "ecs_task_execution_policies" {
  type    = list(string)
  default = []
}

variable "app_storage_bucket_arn" {
  description = "ARN of S3 bucket for application storage"
  type        = string
  default     = ""
}
























