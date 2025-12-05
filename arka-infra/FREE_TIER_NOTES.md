# AWS Free Tier Configuration

This infrastructure is configured to be compatible with AWS Free Tier limitations.

## Free Tier Limitations Applied

### RDS Aurora PostgreSQL

1. **Express Configuration (Aurora Serverless v2)**: Enabled for Free Tier
   - Free Tier requires Aurora Serverless v2 with Express Configuration
   - Instance class automatically set to `db.serverless` when enabled
   - ACU range: 0.5 (min) to 1 (max) for Free Tier
   - To disable: Set `database_serverlessv2_enabled = false` in `terraform.tfvars`

2. **Backup Retention**: Set to 1 day (Free Tier limit)
   - Standard accounts can use up to 35 days
   - To change: Update `database_backup_retention_period` in `terraform.tfvars`

3. **Instance Count**: Set to 1 (Free Tier recommendation)
   - Standard accounts use 2+ instances for high availability
   - To change: Update `database_instance_count` in `terraform.tfvars`

### Free Tier Limits

- **750 hours/month** of db.t2.micro, db.t3.micro, or db.t4g.micro instance usage
- **20 GB** of General Purpose (SSD) database storage
- **20 GB** of backup storage
- **1 day** backup retention period

## Upgrading from Free Tier

When you're ready to upgrade your AWS account or move to production:

1. **Update `terraform.tfvars`**:
   ```hcl
   # Option 1: Keep Serverless v2 but increase capacity
   database_serverlessv2_min_capacity = 0.5
   database_serverlessv2_max_capacity = 16  # or higher
   
   # Option 2: Disable Serverless v2 and use provisioned instances
   database_serverlessv2_enabled = false
   database_instance_class = "db.t4g.medium"
   database_instance_count = 2  # For high availability
   database_backup_retention_period = 7  # or up to 35 days
   ```

2. **Apply changes**:
   ```bash
   terraform plan
   terraform apply
   ```

## Cost Considerations

- Free Tier covers first 12 months for new AWS accounts
- After Free Tier expires, you'll be charged for:
  - RDS instance hours
  - Storage (GB/month)
  - Backup storage
  - Data transfer

## Monitoring Usage

Check your Free Tier usage:
1. Go to AWS Console → Billing & Cost Management
2. View "Free Tier" section
3. Monitor RDS usage to stay within limits

