output "cluster_endpoint" {
  description = "RDS Aurora cluster endpoint (writer endpoint)"
  value       = aws_rds_cluster.this.endpoint
}

output "cluster_reader_endpoint" {
  description = "RDS Aurora cluster reader endpoint (for read replicas)"
  value       = aws_rds_cluster.this.reader_endpoint
}

output "cluster_id" {
  description = "RDS Aurora cluster identifier"
  value       = aws_rds_cluster.this.cluster_identifier
}

output "cluster_arn" {
  description = "RDS Aurora cluster ARN"
  value       = aws_rds_cluster.this.arn
}

output "database_name" {
  description = "Name of the default database"
  value       = aws_rds_cluster.this.database_name
}

output "security_group_id" {
  description = "Security group ID for RDS cluster"
  value       = aws_security_group.rds.id
}

