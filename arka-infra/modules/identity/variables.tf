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

