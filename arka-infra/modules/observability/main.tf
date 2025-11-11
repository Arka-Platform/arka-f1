resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project}/${var.environment}"
  retention_in_days = var.retention_in_days

  tags = {
    Name        = "${var.project}-${var.environment}-logs"
    Environment = var.environment
  }
}

