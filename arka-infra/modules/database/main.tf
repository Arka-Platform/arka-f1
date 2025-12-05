resource "aws_security_group" "rds" {
  name        = "${var.project}-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL instance"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-${var.environment}-rds-sg"
  }
}

# Ingress rule is created separately in main.tf to avoid circular dependency

resource "aws_db_subnet_group" "this" {
  name       = "${var.project}-${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project}-${var.environment}-db-subnet-group"
  }
}

# Regular RDS PostgreSQL instance (Free Tier compatible)
resource "aws_db_instance" "this" {
  identifier     = "${var.project}-${var.environment}-postgres"
  engine         = "postgres"
  engine_version = var.engine_version != "" ? var.engine_version : null
  instance_class = var.instance_class

  db_name  = var.database_name
  username = var.master_username
  password = var.master_password

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  backup_retention_period = var.backup_retention_period
  backup_window           = var.preferred_backup_window
  maintenance_window      = var.preferred_maintenance_window

  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.project}-${var.environment}-final-snapshot"
  deletion_protection        = var.deletion_protection

  enabled_cloudwatch_logs_exports = var.cloudwatch_logs_exports
  kms_key_id                      = var.kms_key_id != "" ? var.kms_key_id : null

  publicly_accessible = false
  multi_az            = var.multi_az

  tags = {
    Name = "${var.project}-${var.environment}-postgres"
  }

  # Ignore changes to final_snapshot_identifier to prevent unnecessary replacements
  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}
