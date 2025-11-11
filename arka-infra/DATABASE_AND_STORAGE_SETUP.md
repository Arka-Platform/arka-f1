# RDS Aurora PostgreSQL & S3 Storage Setup

## Overview

This document describes the newly added infrastructure components:
- **RDS Aurora PostgreSQL** database cluster for persistent data storage
- **S3 Application Storage** bucket for future use (file uploads, assets, etc.)

---

## 🗄️ RDS Aurora PostgreSQL Database

### What Was Added

A new `modules/database/` module that provisions:
- **Aurora PostgreSQL cluster** with configurable instance count
- **Security group** allowing access only from ECS service
- **DB subnet group** in private subnets
- **Encryption** at rest (using default KMS key or custom)
- **Backup retention** (7 days by default)
- **CloudWatch logs** export for PostgreSQL logs

### Configuration

**Default Settings:**
- Engine: Aurora PostgreSQL 15.4
- Instance Class: `db.t4g.medium` (ARM-based, cost-effective)
- Instance Count: 2 (for high availability)
- Database Name: `arka`
- Master Username: `postgres`
- Backup Retention: 7 days
- Deletion Protection: Enabled (production-safe)

### Security

- **Network Isolation**: Database is in private subnets, not accessible from internet
- **Security Group**: Only allows connections from ECS service security group on port 5432
- **Encryption**: Storage encrypted at rest
- **No Public Access**: Instances are not publicly accessible

### Connection Details

After deployment, you'll get these outputs:
- `database_cluster_endpoint` - Writer endpoint (for writes and reads)
- `database_cluster_reader_endpoint` - Reader endpoint (for read-only queries)
- `database_name` - Database name
- `database_security_group_id` - Security group ID

### Usage in Application

Update your Spring Boot `application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DATABASE_ENDPOINT}:5432/${DATABASE_NAME}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate  # Use validate in production, not create/update
```

**Important**: Store database credentials in AWS Secrets Manager or SSM Parameter Store, not in code!

### Variables

Key variables you can customize:

```hcl
database_name                    = "arka"
database_master_username         = "postgres"
database_master_password         = "CHANGE_ME"  # Use secrets manager!
database_engine_version          = "15.4"
database_instance_class          = "db.t4g.medium"
database_instance_count          = 2
database_backup_retention_period = 7
database_deletion_protection     = true
database_skip_final_snapshot     = false
```

---

## 📦 S3 Application Storage

### What Was Added

Enhanced `modules/storage/` module with:
- **Application storage bucket** for file uploads, assets, etc.
- **Versioning** enabled by default
- **Encryption** (AES256 by default, or KMS)
- **Lifecycle policies** (optional, for cost optimization)
- **Public access blocked** (secure by default)

### Configuration

**Default Settings:**
- Bucket Name: Auto-generated as `{project}-{environment}-storage`
- Versioning: Enabled
- Encryption: AES256
- Lifecycle Policies: Disabled (can be enabled)

### Lifecycle Policies (Optional)

When enabled, lifecycle policies can:
- **Transition to IA**: Move files to Infrequent Access after 90 days (cheaper storage)
- **Transition to Glacier**: Move to Glacier after 180 days (archival storage)
- **Expire versions**: Delete old versions after 365 days
- **Expire non-current versions**: Delete old non-current versions after 90 days

### Usage in Application

Your application can use this bucket for:
- User file uploads (book covers, profile pictures, etc.)
- Generated reports
- Temporary files
- Static assets (if not using CloudFront)

**IAM Permissions Needed:**

Add to your ECS task role:
```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject",
    "s3:DeleteObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::${bucket_name}",
    "arn:aws:s3:::${bucket_name}/*"
  ]
}
```

### Variables

Key variables you can customize:

```hcl
app_storage_bucket_enabled          = true
app_storage_bucket_name             = ""  # Auto-generated if empty
app_storage_versioning_enabled      = true
app_storage_encryption_algorithm   = "AES256"
app_storage_lifecycle_enabled       = false
app_storage_ia_transition_days      = 90
app_storage_glacier_transition_enabled = false
app_storage_glacier_transition_days = 180
```

---

## 🚀 Deployment

### Prerequisites

1. **Database Password**: You must provide `database_master_password` variable
2. **AWS Credentials**: Configured with appropriate permissions
3. **Terraform**: Version >= 1.6.0

### Deploy with Database

```bash
cd arka-infra

terraform init

terraform plan \
  -var='project=arka' \
  -var='environment=dev' \
  -var='container_image=123456789012.dkr.ecr.us-east-1.amazonaws.com/arka-app:latest' \
  -var='database_master_password=YourSecurePassword123!'

terraform apply \
  -var='project=arka' \
  -var='environment=dev' \
  -var='container_image=123456789012.dkr.ecr.us-east-1.amazonaws.com/arka-app:latest' \
  -var='database_master_password=YourSecurePassword123!'
```

### Using Secrets Manager (Recommended)

Instead of passing password via command line:

1. Store password in Secrets Manager:
```bash
aws secretsmanager create-secret \
  --name arka/dev/database-password \
  --secret-string "YourSecurePassword123!"
```

2. Use in Terraform:
```hcl
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "arka/dev/database-password"
}

module "database" {
  # ...
  master_password = jsondecode(data.aws_secretsmanager_secret_version.db_password.secret_string)
}
```

---

## 📊 Cost Considerations

### RDS Aurora PostgreSQL

- **db.t4g.medium**: ~$0.10/hour per instance = ~$72/month per instance
- **2 instances**: ~$144/month (for HA)
- **Storage**: $0.10/GB-month
- **Backups**: Included in storage cost (up to 100% of provisioned storage)
- **Data Transfer**: Standard AWS data transfer pricing

**Cost Optimization Tips:**
- Use `db.t4g.small` for dev/staging (~$36/month per instance)
- Reduce instance count to 1 for dev (no HA needed)
- Use Reserved Instances for production (30-50% savings)

### S3 Storage

- **Standard Storage**: $0.023/GB-month (first 50 TB)
- **Infrequent Access**: $0.0125/GB-month (after lifecycle transition)
- **Glacier**: $0.004/GB-month (archival)
- **Requests**: Very cheap (pennies per 1000 requests)

**Cost Optimization Tips:**
- Enable lifecycle policies to move old files to cheaper storage
- Use versioning only if needed (increases storage costs)
- Consider S3 Intelligent-Tiering for automatic cost optimization

---

## 🔒 Security Best Practices

### Database

1. **✅ Use Secrets Manager**: Never hardcode passwords
2. **✅ Enable Deletion Protection**: Prevents accidental deletion
3. **✅ Use Private Subnets**: Database not accessible from internet
4. **✅ Security Groups**: Only allow ECS service access
5. **✅ Encryption**: Enabled by default
6. **✅ Regular Backups**: 7-day retention (increase for production)

### S3 Storage

1. **✅ Block Public Access**: Enabled by default
2. **✅ Encryption**: AES256 or KMS
3. **✅ Versioning**: Enabled for data protection
4. **✅ IAM Policies**: Principle of least privilege
5. **✅ Bucket Policies**: Restrict access as needed
6. **✅ Lifecycle Policies**: Automate cost optimization

---

## 🔄 Migration from H2

If you're currently using H2 in-memory database:

1. **Deploy RDS**: Use Terraform to create the database
2. **Update Application Config**: Change datasource URL to RDS endpoint
3. **Run Migrations**: Flyway will create schema on first connection
4. **Test Connection**: Verify application can connect
5. **Deploy**: Update ECS service with new configuration

**Note**: H2 data will be lost. If you have important data, export it first.

---

## 📝 Next Steps

1. **Update Backend**: Configure Spring Boot to use RDS instead of H2
2. **Add Secrets Management**: Store database credentials in Secrets Manager
3. **Update IAM**: Add S3 permissions to ECS task role (if using S3)
4. **Test Connection**: Verify database connectivity from ECS tasks
5. **Monitor**: Set up CloudWatch alarms for database metrics
6. **Backup Strategy**: Review backup retention and test restore process

---

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: Application can't connect to database

**Solutions**:
1. Check security group allows ECS service security group
2. Verify database is in same VPC as ECS
3. Check database endpoint is correct
4. Verify credentials are correct
5. Check CloudWatch logs for connection errors

### S3 Access Issues

**Problem**: Application can't access S3 bucket

**Solutions**:
1. Verify IAM permissions on ECS task role
2. Check bucket name is correct
3. Verify bucket exists in same region
4. Check bucket policy (if any)

---

## 📚 References

- [RDS Aurora PostgreSQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraPostgreSQL.html)
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)

