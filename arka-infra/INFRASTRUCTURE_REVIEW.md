# Infrastructure Critical Review & Summary

## Executive Summary

This document provides a critical review of the Arka platform infrastructure and explains how frontend and backend components are linked together in simple terms.

---

## 🏗️ Current Architecture Overview (Layman's Terms)

### The Big Picture

Think of your infrastructure like a **restaurant**:
- **Frontend** = The dining room (what customers see)
- **Backend** = The kitchen (where the work happens)
- **Load Balancer (ALB)** = The host who directs customers to available tables
- **ECS Fargate** = The kitchen staff (your application servers)
- **VPC/Subnets** = The building layout (public areas vs. private kitchen)

### How Frontend & Backend Are Currently Linked

**Current Setup: Monolithic Container Approach**
- The frontend (React app) is **baked into** the backend during Docker build
- Frontend static files are copied into Spring Boot's `static/` folder
- Spring Boot serves **both** the React app AND the API from the same container on port 8080
- This means: **One container = Frontend + Backend together**

**The Flow:**
1. User visits the ALB DNS name (e.g., `arka-dev-alb-123456.us-east-1.elb.amazonaws.com`)
2. ALB forwards requests to ECS tasks running on port 8080
3. Spring Boot receives the request:
   - If it's an API call (`/api/v1/*`), Spring Boot handles it
   - If it's a page route (`/`, `/books`, etc.), Spring Boot serves the React app
   - React app makes API calls to the same domain (relative URLs like `/api/v1/books`)

**Pros:**
- ✅ Simple deployment (one container)
- ✅ No CORS issues (same origin)
- ✅ Easy to get started

**Cons:**
- ❌ Can't scale frontend and backend independently
- ❌ Frontend changes require full backend rebuild
- ❌ Not following modern best practices (CDN for static assets)

---

## 📋 Infrastructure Resources Breakdown

### 1. **Network Module** (`modules/network/`)
**What it does:** Creates the virtual network where everything lives

**Resources:**
- **VPC (Virtual Private Cloud)**: Your private network in AWS (like your own isolated internet)
  - CIDR: `10.10.0.0/16` (65,536 IP addresses)
- **Public Subnets** (2): Where the load balancer lives (accessible from internet)
  - `10.10.0.0/24` and `10.10.1.0/24`
- **Private Subnets** (2): Where your application containers run (hidden from internet)
  - `10.10.10.0/24` and `10.10.11.0/24`
- **Internet Gateway**: Door to the public internet
- **NAT Gateway**: Allows private subnets to access internet (for pulling Docker images, etc.) without being directly accessible
- **Route Tables**: Traffic directors telling packets where to go

**Critical Issue:** Only **ONE NAT Gateway** for both private subnets
- ⚠️ **Single Point of Failure**: If the NAT Gateway's AZ goes down, half your subnets lose internet
- 💰 **Cost**: NAT Gateways cost ~$32/month + data transfer
- ✅ **Recommendation**: Add second NAT Gateway in second AZ for high availability

---

### 2. **Compute Module** (`modules/compute/`)
**What it does:** Runs your application containers

**Resources:**
- **ECS Cluster**: Container orchestration platform (like Kubernetes, but simpler)
- **ECS Fargate Service**: Manages running 2 containers (default)
- **Application Load Balancer (ALB)**: 
  - Listens on port 80 (HTTP only - **NO HTTPS**)
  - Distributes traffic to healthy containers
  - Health check: `/actuator/health/readiness`
- **Target Group**: Routes traffic to containers on port 8080
- **Security Groups**: Firewall rules
  - ALB SG: Allows HTTP (port 80) from anywhere
  - Service SG: Only allows traffic from ALB on port 8080

**Critical Issues:**

1. **❌ NO HTTPS/SSL**
   - All traffic is unencrypted HTTP
   - **Security Risk**: Passwords, API keys, user data transmitted in plain text
   - **Fix Required**: Add ACM certificate + HTTPS listener (port 443)

2. **❌ NO WAF (Web Application Firewall)**
   - Vulnerable to common attacks (SQL injection, XSS, etc.)
   - **Fix Required**: Add AWS WAF in front of ALB

3. **⚠️ Health Check Path May Not Exist**
   - Health check uses `/actuator/health/readiness`
   - Need to verify Spring Boot Actuator is properly configured

4. **⚠️ No Auto-Scaling**
   - Fixed at 2 tasks (desired_count)
   - Won't scale up during traffic spikes
   - Won't scale down to save costs
   - **Fix Required**: Add ECS Auto Scaling based on CPU/memory

5. **⚠️ No Database**
   - Currently using H2 in-memory database (data lost on restart)
   - **Fix Required**: Add RDS PostgreSQL module

---

### 3. **Storage Module** (`modules/storage/`)
**What it does:** Stores logs and files

**Resources:**
- **S3 Bucket** (optional): Stores ALB access logs
  - Encrypted (AES256)
  - Versioning enabled
  - Private (no public access)

**Issues:**
- ✅ Good security practices
- ⚠️ No lifecycle policies (logs will accumulate forever)
- ⚠️ No separate bucket for application uploads (if needed)

---

### 4. **Identity Module** (`modules/identity/`)
**What it does:** Manages permissions (who can do what)

**Resources:**
- **ECS Task Execution Role**: Allows ECS to pull images, write logs
- **ECS Task Role**: Allows containers to access AWS services

**Critical Issues:**

1. **❌ Overly Permissive Task Role**
   - Task role has `logs:*` permissions (wildcard)
   - Should be scoped to specific log groups
   - **Security Risk**: If container is compromised, attacker has broad access

2. **⚠️ No Secrets Management**
   - No integration with AWS Secrets Manager or SSM Parameter Store
   - Database credentials, API keys would need to be hardcoded or passed as env vars
   - **Fix Required**: Add secrets access policies

---

### 5. **Observability Module** (`modules/observability/`)
**What it does:** Logging and monitoring

**Resources:**
- **CloudWatch Log Group**: Stores container logs
  - Retention: 30 days (default)
  - Logs from ECS tasks go here

**Critical Issues:**

1. **❌ No Metrics/Monitoring**
   - No CloudWatch alarms
   - No dashboards
   - No alerting when things break
   - **Fix Required**: Add CloudWatch alarms for:
     - High CPU/memory
     - Unhealthy targets
     - 5xx errors
     - Request latency

2. **⚠️ No Distributed Tracing**
   - Can't track requests across services (if you add more later)
   - **Future Enhancement**: Add X-Ray or OpenTelemetry

---

## 🔗 Frontend-Backend Linking: Current State

### How It Works Now

```
User Browser
    ↓
ALB (Load Balancer) - http://arka-dev-alb-xxx.elb.amazonaws.com
    ↓
ECS Fargate Container (Port 8080)
    ├── Spring Boot Backend
    │   ├── API Endpoints: /api/v1/books, /api/v1/users, etc.
    │   └── Static File Server
    │       └── React App (built files in /static/)
    │           └── Makes API calls to same domain (/api/v1/*)
```

**Key Points:**
1. **Single Domain**: Everything runs on one domain (the ALB DNS)
2. **No CORS Needed**: Frontend and API are same origin
3. **Relative URLs**: Frontend uses relative paths like `/api/v1/books`
4. **Spring Boot Routing**: 
   - API routes: `/api/**` → Spring controllers
   - All other routes: `/**` → React app (SPA fallback)

### Missing Configuration

**❌ No API Base URL Configuration in Frontend**
- Frontend code shows mock API calls (see `AuthContext.tsx`)
- No environment variable for API endpoint
- **Fix Required**: Add `VITE_API_BASE_URL` environment variable
- In production, this would be empty (relative URLs)
- In development, this could be `http://localhost:8080`

**❌ No CORS Configuration for Production**
- `application.yml` only has CORS for `localhost:5173`
- Need to add ALB DNS to allowed origins
- Or better: Use environment variables

---

## 🚨 Critical Security Issues

1. **HTTP Only (No HTTPS)**
   - **Risk**: All data transmitted in plain text
   - **Fix**: Add ACM certificate + HTTPS listener

2. **No WAF**
   - **Risk**: Vulnerable to common web attacks
   - **Fix**: Add AWS WAF

3. **Overly Permissive IAM**
   - **Risk**: If container compromised, attacker has broad access
   - **Fix**: Principle of least privilege

4. **No Secrets Management**
   - **Risk**: Credentials in environment variables or code
   - **Fix**: Use AWS Secrets Manager

5. **Public ALB (No IP Restrictions)**
   - **Risk**: Anyone can access the application
   - **Fix**: Add security group rules or WAF IP whitelist (if needed)

---

## 📊 Missing Infrastructure Components

1. **Database (RDS)**
   - Currently using H2 in-memory (data lost on restart)
   - Need PostgreSQL or MySQL

2. **Cache (ElastiCache)**
   - For session storage, API caching
   - Optional but recommended

3. **CDN (CloudFront)**
   - For serving static frontend assets
   - Better performance, lower costs

4. **Separate Frontend Hosting**
   - S3 + CloudFront for React app
   - Backend API on separate domain
   - Better separation of concerns

5. **CI/CD Pipeline**
   - Automated builds and deployments
   - Not in Terraform (use GitHub Actions, etc.)

---

## ✅ Recommendations (Priority Order)

### **P0 - Critical (Do Immediately)**

1. **Add HTTPS/SSL**
   - Request ACM certificate
   - Add HTTPS listener (port 443)
   - Redirect HTTP → HTTPS

2. **Add Database (RDS)**
   - Create RDS PostgreSQL module
   - Update backend to use RDS instead of H2
   - Add security group rules

3. **Fix IAM Permissions**
   - Scope task role to specific log groups
   - Add secrets manager access

4. **Add Monitoring**
   - CloudWatch alarms for health
   - Dashboard for key metrics

### **P1 - High Priority (Do Soon)**

5. **Add Auto-Scaling**
   - ECS service auto-scaling
   - Target tracking on CPU/memory

6. **Add WAF**
   - Basic AWS Managed Rules
   - Rate limiting

7. **Add Second NAT Gateway**
   - High availability
   - Multi-AZ redundancy

8. **Add Secrets Management**
   - AWS Secrets Manager integration
   - Remove hardcoded credentials

### **P2 - Medium Priority (Nice to Have)**

9. **Separate Frontend Hosting**
   - S3 + CloudFront for React app
   - API on separate subdomain

10. **Add CI/CD**
    - Automated builds
    - Automated deployments

11. **Add Distributed Tracing**
    - X-Ray or OpenTelemetry

12. **Add Cache Layer**
    - ElastiCache Redis
    - Session storage

---

## 📝 Frontend-Backend Linking: Recommended Approach

### Option 1: Keep Current (Monolithic) - Simple
**Best for:** MVP, small teams, rapid development

**Changes needed:**
- Add environment variable for API URL (empty in prod, localhost in dev)
- Update frontend to use environment variable
- Add CORS configuration for ALB domain

### Option 2: Separate Frontend (Recommended for Production)
**Best for:** Production, scaling, modern architecture

**Architecture:**
```
Frontend:
  S3 Bucket (static files)
    ↓
  CloudFront CDN
    ↓
  Users

Backend:
  ALB
    ↓
  ECS Fargate
    ↓
  Spring Boot API
```

**Changes needed:**
- Deploy React app to S3 + CloudFront
- Backend API on separate subdomain (e.g., `api.arka.com`)
- Frontend calls `https://api.arka.com/api/v1/*`
- Configure CORS on backend for frontend domain

---

## 🎯 Summary

**Current State:**
- ✅ Basic infrastructure is functional
- ✅ Frontend and backend are linked via monolithic container
- ❌ Missing critical security (HTTPS, WAF)
- ❌ Missing database
- ❌ Missing monitoring/alerting
- ❌ Missing auto-scaling

**Frontend-Backend Link:**
- Currently: Same container, same domain, no CORS issues
- Works for MVP, but not production-ready
- Need to add API configuration in frontend
- Need to add CORS configuration for production

**Next Steps:**
1. Add HTTPS (P0)
2. Add RDS database (P0)
3. Fix IAM permissions (P0)
4. Add monitoring (P0)
5. Add auto-scaling (P1)
6. Add WAF (P1)

---

## 📚 Additional Notes

- **Terraform State**: No remote state backend configured (use S3 + DynamoDB for production)
- **Multi-Environment**: Structure supports dev/staging/prod via variables
- **Cost Optimization**: Consider reserved capacity for RDS, NAT Gateway optimization
- **Disaster Recovery**: No backup/restore strategy defined
- **Compliance**: May need additional controls for GDPR, HIPAA, etc. (if applicable)

