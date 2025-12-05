output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.this.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.this.arn
}

output "service_security_group_id" {
  value = aws_security_group.service.id
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.this.name
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.this.name
}

output "task_definition_arn" {
  description = "Task definition ARN"
  value       = aws_ecs_task_definition.this.arn
}

# Note: Task IPs are dynamic. Use AWS CLI or Console to get current task IPs:
# aws ecs list-tasks --cluster <cluster-name> --service-name <service-name>
# aws ecs describe-tasks --cluster <cluster-name> --tasks <task-id>

