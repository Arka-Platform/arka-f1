output "cluster_endpoint" {
  description = "RDS PostgreSQL endpoint (for compatibility with Aurora naming)"
  value       = aws_db_instance.this.endpoint
}

output "cluster_reader_endpoint" {
  description = "RDS PostgreSQL endpoint (same as cluster_endpoint for single instance)"
  value       = aws_db_instance.this.endpoint
}

output "cluster_id" {
  description = "RDS PostgreSQL instance identifier"
  value       = aws_db_instance.this.id
}

output "cluster_arn" {
  description = "RDS PostgreSQL instance ARN"
  value       = aws_db_instance.this.arn
}

output "database_name" {
  description = "Name of the default database"
  value       = aws_db_instance.this.db_name
}

output "security_group_id" {
  description = "Security group ID for RDS instance"
  value       = aws_security_group.rds.id
}

output "instance_endpoint" {
  description = "RDS PostgreSQL instance endpoint"
  value       = aws_db_instance.this.endpoint
}

output "instance_address" {
  description = "RDS PostgreSQL instance address (hostname without port)"
  value       = aws_db_instance.this.address
}

output "instance_port" {
  description = "RDS PostgreSQL instance port"
  value       = aws_db_instance.this.port
}
