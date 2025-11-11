# Infrastructure Capacity Analysis

## Current Configuration Summary

### Compute Resources
- **ECS Tasks**: 2 tasks (desired_count = 2)
- **CPU per Task**: 512 units (0.5 vCPU)
- **Memory per Task**: 1024 MB (1 GB)
- **Total CPU**: 1.0 vCPU (2 × 0.5)
- **Total Memory**: 2 GB (2 × 1 GB)

### Load Balancer
- **Type**: Application Load Balancer (ALB)
- **Protocol**: HTTP (port 80)
- **Health Check**: Every 30 seconds

### Application
- **Framework**: Spring Boot 3.3.4 with embedded Tomcat
- **Default Thread Pool**: 200 threads per instance (Tomcat default)
- **Total Threads**: 400 threads (2 tasks × 200)

### Database
- **Type**: RDS Aurora PostgreSQL
- **Instance Class**: db.t4g.medium (2 instances)
- **Connection Capacity**: ~1,000 connections per instance

---

## Concurrent Request Capacity Estimates

### 🟢 **Conservative Estimate: 200-400 Concurrent Requests**

**Bottleneck**: CPU (0.5 vCPU per task)

**Calculation:**
- Each task has 0.5 vCPU = limited processing power
- Spring Boot default: ~200 threads per instance
- With 2 tasks: 400 total threads
- **Realistic capacity**: 200-400 concurrent requests without degradation

**Assumptions:**
- Simple API requests (CRUD operations)
- Average response time: 50-200ms
- Light database queries
- No heavy processing/computation

### 🟡 **Optimistic Estimate: 400-800 Concurrent Requests**

**If requests are:**
- Very fast (< 50ms response time)
- Mostly static content or cached
- Minimal database queries
- Well-optimized code

### 🔴 **Under Load: Degradation Expected**

**At 500+ concurrent requests:**
- Response times will increase significantly
- Some requests may timeout
- CPU will be maxed out
- Memory pressure may occur

---

## Component-by-Component Analysis

### 1. Application Load Balancer (ALB)

**Capacity**: ✅ **NOT A BOTTLENECK**
- ALBs can handle **millions of requests per second**
- Your ALB can easily handle 10,000+ concurrent connections
- **Verdict**: ALB will not limit your capacity

### 2. ECS Fargate Tasks

**Capacity**: ⚠️ **PRIMARY BOTTLENECK**

**Per Task (0.5 vCPU, 1 GB RAM):**
- **CPU**: 0.5 vCPU = limited processing power
- **Memory**: 1 GB = sufficient for Spring Boot, but tight
- **Threads**: 200 (Tomcat default)
- **Estimated Capacity**: 100-200 concurrent requests per task

**With 2 Tasks:**
- **Total Capacity**: 200-400 concurrent requests
- **Peak Capacity**: ~500 requests (with degradation)

**Limiting Factors:**
1. **CPU**: 0.5 vCPU is small for high-traffic applications
2. **Memory**: 1 GB may be tight if application uses caching
3. **Thread Pool**: 200 threads per task (can be tuned)

### 3. Spring Boot Application

**Default Configuration:**
- **Tomcat Max Threads**: 200 per instance
- **Connection Timeout**: 20 seconds (default)
- **Keep-Alive**: Enabled (default)

**Capacity per Instance:**
- **Theoretical**: 200 concurrent requests (one per thread)
- **Practical**: 150-180 concurrent requests (accounting for overhead)

**With 2 Instances:**
- **Theoretical**: 400 concurrent requests
- **Practical**: 300-360 concurrent requests

### 4. Database (RDS Aurora PostgreSQL)

**Capacity**: ✅ **NOT A BOTTLENECK** (for current load)

**db.t4g.medium (2 instances):**
- **Max Connections**: ~1,000 per instance = 2,000 total
- **Read Capacity**: Very high (Aurora read replicas)
- **Write Capacity**: High (Aurora cluster)

**Verdict**: Database can handle 10x+ your application capacity

---

## Real-World Scenarios

### Scenario 1: Light Traffic (Typical Usage)
- **Concurrent Users**: 50-100
- **Requests per Second**: 10-20
- **Status**: ✅ **Excellent performance**
- **Response Time**: < 100ms
- **CPU Usage**: 20-30%

### Scenario 2: Moderate Traffic
- **Concurrent Users**: 200-300
- **Requests per Second**: 40-60
- **Status**: ✅ **Good performance**
- **Response Time**: 100-300ms
- **CPU Usage**: 50-70%

### Scenario 3: High Traffic (Peak Load)
- **Concurrent Users**: 400-500
- **Requests per Second**: 80-100
- **Status**: ⚠️ **Degradation begins**
- **Response Time**: 300-1000ms
- **CPU Usage**: 80-95%
- **Some timeouts possible**

### Scenario 4: Overload
- **Concurrent Users**: 600+
- **Requests per Second**: 120+
- **Status**: 🔴 **Poor performance**
- **Response Time**: 1000ms+
- **CPU Usage**: 95-100%
- **Many timeouts, errors**

---

## Factors Affecting Capacity

### ✅ **What Helps Capacity:**
1. **Fast Response Times**: Simple, optimized endpoints
2. **Caching**: Redis/Memcached for frequently accessed data
3. **Database Connection Pooling**: Efficient connection management
4. **Static Content**: Served from CDN (not through application)
5. **Async Processing**: Background jobs for heavy operations

### ❌ **What Hurts Capacity:**
1. **Slow Database Queries**: N+1 queries, missing indexes
2. **Heavy Computation**: Image processing, complex calculations
3. **Large Payloads**: Big JSON responses, file uploads
4. **Synchronous Operations**: Blocking I/O operations
5. **Memory Leaks**: Gradual degradation over time

---

## Recommendations for Scaling

### Immediate Improvements (No Infrastructure Changes)

1. **Optimize Application Code**
   - Add database indexes
   - Implement connection pooling (HikariCP)
   - Add caching (Redis/Memcached)
   - Optimize queries (avoid N+1)

2. **Tune Spring Boot Thread Pool**
   ```yaml
   server:
     tomcat:
       threads:
         max: 300  # Increase from 200
         min-spare: 50
       max-connections: 10000
   ```

3. **Add Database Connection Pooling**
   ```yaml
   spring:
     datasource:
       hikari:
         maximum-pool-size: 20
         minimum-idle: 5
         connection-timeout: 30000
   ```

### Infrastructure Scaling Options

#### Option 1: Increase Task Resources (Easiest)
```hcl
fargate_cpu    = 1024  # 1 vCPU (double current)
fargate_memory = 2048  # 2 GB (double current)
```
**Result**: ~400-800 concurrent requests
**Cost**: ~2x current cost

#### Option 2: Add More Tasks (Horizontal Scaling)
```hcl
desired_count = 4  # Double from 2
```
**Result**: ~400-800 concurrent requests
**Cost**: ~2x current cost
**Benefit**: Better fault tolerance

#### Option 3: Both (Recommended for Production)
```hcl
fargate_cpu    = 1024  # 1 vCPU
fargate_memory = 2048  # 2 GB
desired_count  = 4     # 4 tasks
```
**Result**: ~800-1600 concurrent requests
**Cost**: ~4x current cost
**Benefit**: High availability + capacity

#### Option 4: Enable Auto-Scaling (Best for Variable Traffic)
- Scale based on CPU/memory metrics
- Scale from 2 to 10 tasks automatically
- Handle traffic spikes gracefully
- Cost: Pay only for what you use

---

## Capacity by Request Type

### Static Content (Frontend Assets)
- **Capacity**: Very high (served from Spring Boot static folder)
- **Bottleneck**: None (if cached properly)
- **Recommendation**: Move to S3 + CloudFront for better performance

### Simple API Calls (GET /api/v1/books)
- **Capacity**: 200-400 concurrent
- **Response Time**: 50-200ms
- **Bottleneck**: CPU/Threads

### Complex API Calls (POST with validation, DB writes)
- **Capacity**: 100-200 concurrent
- **Response Time**: 200-500ms
- **Bottleneck**: CPU + Database writes

### File Uploads
- **Capacity**: 20-50 concurrent (depends on file size)
- **Response Time**: Variable (seconds)
- **Bottleneck**: Memory + Network bandwidth
- **Recommendation**: Use S3 direct uploads (presigned URLs)

---

## Monitoring & Alerts

### Key Metrics to Watch

1. **ALB Metrics**
   - `TargetResponseTime`: Should be < 500ms
   - `HTTPCode_Target_5XX_Count`: Should be 0
   - `RequestCount`: Track growth

2. **ECS Metrics**
   - `CPUUtilization`: Alert if > 80%
   - `MemoryUtilization`: Alert if > 85%
   - `RunningTaskCount`: Track scaling

3. **Application Metrics**
   - Response time (p50, p95, p99)
   - Error rate
   - Active threads
   - Database connection pool usage

### Recommended CloudWatch Alarms

```hcl
# High CPU
- Metric: CPUUtilization
- Threshold: > 80%
- Action: Scale up

# High Memory
- Metric: MemoryUtilization
- Threshold: > 85%
- Action: Scale up

# High Error Rate
- Metric: HTTPCode_Target_5XX_Count
- Threshold: > 10 in 5 minutes
- Action: Alert + investigate

# Slow Response Time
- Metric: TargetResponseTime
- Threshold: > 1000ms (p95)
- Action: Alert
```

---

## Cost vs Capacity Trade-offs

| Configuration | Concurrent Requests | Monthly Cost (Est.) | Best For |
|--------------|---------------------|---------------------|----------|
| Current (0.5 vCPU, 2 tasks) | 200-400 | ~$50-70 | Development, low traffic |
| 1 vCPU, 2 tasks | 400-800 | ~$100-140 | Staging, moderate traffic |
| 1 vCPU, 4 tasks | 800-1600 | ~$200-280 | Production, high traffic |
| 2 vCPU, 4 tasks | 1600-3200 | ~$400-560 | Production, very high traffic |
| Auto-scaling (2-10 tasks) | 200-2000 | Variable | Variable traffic patterns |

*Costs are estimates for ECS Fargate only. Add ALB (~$20/month), RDS, and other services.*

---

## Summary

### Current Capacity: **200-400 Concurrent Requests**

**Breakdown:**
- ✅ ALB: Not a bottleneck (handles millions)
- ⚠️ ECS Tasks: Primary bottleneck (0.5 vCPU per task)
- ✅ Database: Not a bottleneck (can handle 10x+)
- ⚠️ Application: Limited by CPU and thread pool

### Recommendations

1. **Short Term**: Optimize application code (caching, connection pooling)
2. **Medium Term**: Increase to 1 vCPU per task
3. **Long Term**: Enable auto-scaling for production

### When to Scale

- **Scale Up**: If CPU > 80% consistently
- **Scale Out**: If response times > 500ms consistently
- **Scale Both**: If experiencing timeouts or errors

---

## Testing Your Capacity

### Load Testing Tools

1. **Apache JMeter**: Free, powerful
2. **k6**: Modern, developer-friendly
3. **Artillery**: Simple, Node.js based
4. **AWS Load Testing**: Managed service

### Test Scenarios

1. **Baseline**: 50 concurrent users, measure response times
2. **Normal Load**: 200 concurrent users
3. **Peak Load**: 400 concurrent users
4. **Stress Test**: 600+ concurrent users (find breaking point)

### What to Measure

- Response time (p50, p95, p99)
- Error rate
- CPU/Memory usage
- Database connection pool usage
- Throughput (requests per second)

---

## Conclusion

Your current setup can handle **200-400 concurrent requests** comfortably, with degradation starting around 400-500 concurrent requests.

**For production use**, consider:
1. Increasing CPU to 1 vCPU per task
2. Adding auto-scaling
3. Implementing caching
4. Optimizing database queries

The infrastructure is well-designed but undersized for high-traffic scenarios. The good news is that scaling is straightforward with ECS Fargate - just increase CPU/memory or add more tasks.

