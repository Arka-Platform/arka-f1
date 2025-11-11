# Frontend-Backend Linking: Simple Explanation

## 🎯 How They're Connected Right Now

### The Simple Version

Your frontend and backend are **packed together in one box** (one Docker container).

```
┌─────────────────────────────────────────┐
│         Docker Container                │
│  ┌───────────────────────────────────┐  │
│  │   Spring Boot (Backend)           │  │
│  │   - API: /api/v1/books           │  │
│  │   - API: /api/v1/users           │  │
│  │                                  │  │
│  │   Static Files (Frontend)        │  │
│  │   - React App (built)            │  │
│  │   - index.html, JS, CSS          │  │
│  └───────────────────────────────────┘  │
│         Port 8080                         │
└─────────────────────────────────────────┘
```

### The Flow When a User Visits Your Site

1. **User types URL** → `http://arka-dev-alb-xxx.elb.amazonaws.com`
2. **Load Balancer (ALB)** receives the request
3. **ALB forwards** to one of your containers (you have 2 running)
4. **Spring Boot receives** the request:
   - If URL starts with `/api/v1/*` → Backend handles it (returns JSON)
   - If URL is anything else (`/`, `/books`, `/login`) → Spring Boot serves the React app
5. **React app loads** in the browser
6. **React app makes API calls** to the same domain:
   - Example: `fetch('/api/v1/books')` → Goes to same server
   - No CORS issues because same origin!

### Visual Flow Diagram

```
User's Browser
    │
    │ GET http://arka-alb.com/
    ▼
┌─────────────────┐
│  Load Balancer  │  (ALB - Application Load Balancer)
│  Port 80 (HTTP) │
└─────────────────┘
    │
    │ Forwards to healthy container
    ▼
┌─────────────────────────────────────┐
│  ECS Fargate Container              │
│  ┌───────────────────────────────┐  │
│  │ Spring Boot (Port 8080)       │  │
│  │                               │  │
│  │  Routes:                       │  │
│  │  /api/v1/*  → Backend API     │  │
│  │  /*         → React App        │  │
│  │                               │  │
│  │  React App (in /static/)      │  │
│  │  - Makes calls to /api/v1/*   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 🔍 What This Means

### ✅ Advantages

1. **Simple**: One container to deploy, one thing to manage
2. **No CORS**: Frontend and API are same origin, no CORS configuration needed
3. **Easy Development**: Build once, deploy once
4. **Cost Effective**: Only pay for one set of containers

### ❌ Disadvantages

1. **Can't Scale Separately**: If frontend gets heavy traffic, you scale backend too (wasteful)
2. **Slow Frontend Updates**: Changing frontend requires rebuilding entire container
3. **No CDN**: Static files served from application server (slower than CDN)
4. **Tight Coupling**: Frontend and backend must deploy together

---

## 🛠️ How It's Built

### Docker Build Process

Looking at your `Dockerfile`:

```dockerfile
# Step 1: Build React frontend
FROM node:20-alpine AS frontend-build
RUN npm run build  # Creates frontend/dist/

# Step 2: Build Spring Boot backend
FROM maven:3.9.6 AS backend-build
COPY --from=frontend-build /app/frontend/dist ./arka-backend/src/main/resources/static
RUN mvn package  # Packages Spring Boot with frontend inside

# Step 3: Runtime
FROM gcr.io/distroless/java21
COPY app.jar  # Contains both backend + frontend
EXPOSE 8080
```

**Key Point**: Frontend build output (`dist/`) is copied into Spring Boot's `static/` folder, so Spring Boot can serve it.

### Spring Boot Configuration

Spring Boot is configured to:
1. Serve static files from `classpath:/static/` (where your React app is)
2. Forward all non-API routes to `index.html` (for React Router)
3. Handle API routes normally

---

## ⚠️ Current Issues with Frontend-Backend Linking

### 1. **No API Configuration in Frontend**

**Problem**: Frontend code doesn't have a way to configure the API URL.

**Current State**:
- Frontend uses mock data (see `AuthContext.tsx`)
- No environment variables for API endpoint
- No API client configured

**What's Needed**:
```typescript
// frontend/src/config/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = {
  baseURL: API_BASE_URL,
  // ... fetch wrapper
};
```

**Environment Variables**:
- Development: `VITE_API_BASE_URL=http://localhost:8080`
- Production: `VITE_API_BASE_URL=` (empty = relative URLs, same domain)

### 2. **CORS Not Configured for Production**

**Problem**: `application.yml` only allows `localhost:5173` for CORS.

**Current State**:
```yaml
app:
  cors:
    allowed-origins:
      - http://localhost:5173  # Only localhost!
```

**What's Needed**:
```yaml
app:
  cors:
    allowed-origins:
      - http://localhost:5173
      - https://${ALB_DNS_NAME}  # Your ALB domain
      - ${ALLOWED_ORIGINS}  # From environment variable
```

### 3. **No HTTPS**

**Problem**: Everything is HTTP (unencrypted).

**Impact**:
- Passwords, API keys, user data sent in plain text
- Browsers may block features (geolocation, etc.)
- Not production-ready

**What's Needed**:
- AWS Certificate Manager (ACM) certificate
- HTTPS listener on ALB (port 443)
- HTTP → HTTPS redirect

---

## 🚀 Recommended Improvements

### Short Term (Keep Monolithic)

1. **Add API Configuration**
   - Create `frontend/src/config/api.ts`
   - Use environment variables
   - Update all API calls to use the config

2. **Fix CORS**
   - Add ALB DNS to allowed origins
   - Use environment variables

3. **Add HTTPS**
   - Request ACM certificate
   - Add HTTPS listener
   - Redirect HTTP → HTTPS

### Long Term (Separate Frontend)

**Better Architecture**:
```
Frontend:
  S3 Bucket → CloudFront CDN → Users
  Domain: https://arka.com

Backend:
  ALB → ECS Fargate → Spring Boot API
  Domain: https://api.arka.com
```

**Benefits**:
- ✅ Frontend served from CDN (faster, cheaper)
- ✅ Can scale independently
- ✅ Frontend updates don't require backend rebuild
- ✅ Better separation of concerns

**Changes Needed**:
1. Deploy React app to S3 + CloudFront
2. Configure backend CORS for frontend domain
3. Update frontend API base URL to `https://api.arka.com`

---

## 📋 Quick Reference

### Current Setup
- **Frontend Location**: Inside Spring Boot container (`/static/`)
- **Backend Location**: Same container (Spring Boot)
- **Port**: 8080 (both)
- **Domain**: ALB DNS (single domain)
- **API Calls**: Relative URLs (`/api/v1/*`)

### What Needs to Happen
1. ✅ Frontend builds into backend (already done)
2. ❌ Frontend needs API client configuration
3. ❌ Backend needs CORS for production domain
4. ❌ Need HTTPS instead of HTTP
5. ❌ Frontend code needs to actually call APIs (currently mocked)

---

## 🎓 Key Takeaways

1. **Current**: Frontend and backend are in one container, served from one domain
2. **Works For**: MVP, development, simple apps
3. **Not Ideal For**: Production at scale, frequent frontend updates
4. **Next Steps**: Add API config, fix CORS, add HTTPS, then consider separating

---

## 🔗 Related Files

- **Dockerfile**: Shows how frontend is built into backend
- **application.yml**: CORS configuration (needs production domains)
- **frontend/src/contexts/AuthContext.tsx**: Example of mocked API calls
- **arka-infra/modules/compute/main.tf**: ALB and ECS configuration

