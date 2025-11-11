# Troubleshooting GitHub Actions AWS Credentials

## Error: "Credentials could not be loaded"

If you're getting this error even though you've set secrets in GitHub, check the following:

## 1. Verify Secret Names Match Exactly

The workflow expects these **exact** secret names (case-sensitive):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**Check:**
1. Go to: `https://github.com/Arka-Platform/YOUR_REPO_NAME/settings/secrets/actions`
2. Verify the secret names match exactly (no typos, correct case)
3. Make sure there are no extra spaces

## 2. Check Secret Location

Secrets can be set at different levels:
- **Repository secrets** (recommended): `Settings → Secrets and variables → Actions → Repository secrets`
- **Organization secrets**: `Organization Settings → Secrets and variables → Actions`

**Make sure:**
- Secrets are set at the **repository level** (not just organization level)
- Or if using organization secrets, ensure the repository has access

## 3. Verify Workflow File

The workflow file should reference secrets like this:
```yaml
aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 4. Test Secret Access

You can add a test step to verify secrets are accessible:

```yaml
- name: Test secrets (remove after testing)
  run: |
    if [ -z "${{ secrets.AWS_ACCESS_KEY_ID }}" ]; then
      echo "❌ AWS_ACCESS_KEY_ID is not set"
      exit 1
    fi
    if [ -z "${{ secrets.AWS_SECRET_ACCESS_KEY }}" ]; then
      echo "❌ AWS_SECRET_ACCESS_KEY is not set"
      exit 1
    fi
    echo "✅ Secrets are accessible"
```

## 5. Common Issues

### Issue: Secrets set but workflow can't access them
**Solution:** Make sure you're using the correct workflow file. The `deploy-to-ecr-simple.yml` uses access keys, while `deploy-to-ecr.yml` uses IAM roles.

### Issue: Secrets are empty
**Solution:** Re-add the secrets, making sure to copy the full values (no truncation)

### Issue: Wrong repository
**Solution:** Verify you're setting secrets in the correct repository

## 6. Quick Fix Steps

1. **Delete and re-add secrets:**
   - Go to repository settings → Secrets
   - Delete `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
   - Re-add them with correct values

2. **Verify workflow file:**
   - Check `.github/workflows/deploy-to-ecr-simple.yml`
   - Ensure it references `secrets.AWS_ACCESS_KEY_ID` and `secrets.AWS_SECRET_ACCESS_KEY`

3. **Re-run workflow:**
   - Go to Actions tab
   - Re-run the failed workflow

## 7. Alternative: Use Environment Variables

If secrets still don't work, you can try setting them as environment variables in the workflow:

```yaml
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

But this is less secure and not recommended.

## Still Having Issues?

1. Check the workflow logs for more detailed error messages
2. Verify AWS credentials are valid (test with `aws sts get-caller-identity`)
3. Ensure the IAM user has ECR permissions
4. Check if there are any organization policies blocking secret access

