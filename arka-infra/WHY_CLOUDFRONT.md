# Why CloudFront? (Terraform vs CloudFront)

## The Confusion

**Terraform** and **CloudFront** are NOT alternatives - they serve completely different purposes:

- **Terraform** = Infrastructure as Code tool (like a blueprint)
- **CloudFront** = AWS CDN service (the actual service that runs)

## What Each Does

### Terraform
- **Purpose**: Creates and manages AWS resources
- **What it does**: Writes configuration files that tell AWS what to build
- **Analogy**: Like a blueprint for a house

### CloudFront
- **Purpose**: Content Delivery Network (CDN) that serves your frontend
- **What it does**: Caches and serves static files globally
- **Analogy**: Like the actual house that serves content

## Why Use CloudFront for Frontend?

### Option 1: S3 Direct (No CloudFront)
```
User → S3 Bucket
```
**Pros:**
- ✅ Simpler
- ✅ Free (just S3 storage costs)
- ✅ No CloudFront costs

**Cons:**
- ❌ No HTTPS by default (unless you configure it)
- ❌ Slower (no global CDN caching)
- ❌ No custom domain easily
- ❌ No automatic compression
- ❌ Limited caching control

### Option 2: S3 + CloudFront (Current Setup)
```
User → CloudFront (CDN) → S3 Bucket
```
**Pros:**
- ✅ HTTPS by default
- ✅ Fast global CDN (cached at edge locations)
- ✅ Custom domain support
- ✅ Automatic compression
- ✅ Better caching control
- ✅ DDoS protection
- ✅ Lower latency worldwide

**Cons:**
- ❌ Slightly more complex
- ❌ CloudFront costs (but very low for small traffic)

## The Real Question: Do You Need CloudFront?

**For Development/Testing:**
- **You can skip CloudFront** and use S3 directly
- Just disable it in Terraform: `frontend_enable_cloudfront = false`

**For Production:**
- **CloudFront is recommended** for:
  - HTTPS/SSL certificates
  - Better performance
  - Professional setup

## Current Issue

You're accessing the **backend ALB URL** (`http://arka-dev-alb-...`) which serves the backend API, not the frontend.

The frontend should be accessed via:
- **CloudFront URL** (if enabled): `https://d1234567890.cloudfront.net`
- **S3 URL** (if CloudFront disabled): `http://arka-dev-frontend.s3-website-us-east-1.amazonaws.com`

## How to Disable CloudFront (If You Want)

In `terraform.tfvars`:
```hcl
frontend_enable_cloudfront = false
```

Then access frontend via S3 website endpoint (Terraform will output the URL).

## Summary

- **Terraform** = Tool to create CloudFront (and other resources)
- **CloudFront** = Service that serves your frontend
- They work together, not as alternatives
- You can use S3 directly without CloudFront if you want simpler setup



