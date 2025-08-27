# Deployment Guide

This guide covers deploying the StoryBook Creator application using Docker and Google Cloud Run, as well as alternative deployment methods.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Google Cloud Run Deployment](#google-cloud-run-deployment)
- [Alternative Deployment Methods](#alternative-deployment-methods)
- [Production Configuration](#production-configuration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Overview

The StoryBook Creator is designed for cloud deployment with the following characteristics:

- **Containerized**: Docker-based deployment for consistency
- **Stateless**: No local file storage (uses Vercel Blob)
- **Database**: External Supabase PostgreSQL
- **AI Services**: External API integrations
- **Scalable**: Horizontal scaling support

### Deployment Architecture

```
Internet
    ↓
Load Balancer (Cloud Run)
    ↓
Container Instances (Auto-scaling)
    ↓
External Services
├── Supabase (Database + Auth)
├── Vercel Blob (File Storage)  
├── OpenRouter (AI Story Generation)
└── Leonardo AI (Image Generation)
```

## Prerequisites

### Required Services

1. **Google Cloud Platform Account**
   - Billing enabled
   - Cloud Run API enabled
   - Cloud Build API enabled
   - Secret Manager API enabled

2. **Supabase Project**
   - PostgreSQL database
   - Authentication configured
   - Row Level Security policies applied

3. **Vercel Account**
   - Blob storage configured
   - Read/write token generated

4. **AI Service Accounts**
   - OpenRouter API key (story generation)
   - Leonardo AI API key (image generation)

### Local Development Tools

- Docker Desktop
- Google Cloud CLI (`gcloud`)
- Node.js 20+ and pnpm (for local development)
- Git

## Environment Configuration

### Environment Variables

Create the following secrets in Google Secret Manager or set as environment variables:

#### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# File Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# AI Services
OPENROUTER_API_KEY=your_openrouter_api_key
LEONARDO_API_KEY=your_leonardo_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

#### Optional Variables

```bash
# Monitoring and debugging
NEXT_TELEMETRY_DISABLED=1
```

### Google Secret Manager Setup

1. **Create secrets:**
   ```bash
   # Create each secret
   echo "your_supabase_url" | gcloud secrets create SUPABASE_URL --data-file=-
   echo "your_supabase_anon_key" | gcloud secrets create SUPABASE_ANON_KEY --data-file=-
   echo "your_blob_token" | gcloud secrets create BLOB_READ_WRITE_TOKEN --data-file=-
   echo "your_openrouter_key" | gcloud secrets create OPENROUTER_API_KEY --data-file=-
   echo "your_leonardo_key" | gcloud secrets create LEONARDO_API_KEY --data-file=-
   ```

2. **Grant access to Cloud Run:**
   ```bash
   # Get the project number
   PROJECT_NUMBER=$(gcloud projects describe PROJECT_ID --format="value(projectNumber)")
   
   # Grant secret access to Cloud Run service account
   gcloud secrets add-iam-policy-binding SUPABASE_URL \
     --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   
   # Repeat for all secrets...
   ```

## Docker Deployment

### Dockerfile Explanation

The application uses a multi-stage Docker build for optimization:

```dockerfile
# Stage 1: Dependencies - Install Node.js dependencies
FROM node:20-alpine AS deps
# Install dependencies with pnpm

# Stage 2: Builder - Build the Next.js application  
FROM node:20-alpine AS builder
# Copy dependencies and source code
# Build the application with environment variables

# Stage 3: Runner - Production runtime
FROM node:20-alpine AS runner
# Copy built application
# Set up non-root user for security
# Expose port 3000
```

### Local Docker Build and Run

1. **Build the image:**
   ```bash
   docker build -t storybook-app \
     --build-arg NEXT_PUBLIC_SUPABASE_URL=your_url \
     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
     .
   ```

2. **Run locally:**
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=your_url \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
     -e OPENROUTER_API_KEY=your_key \
     -e LEONARDO_API_KEY=your_key \
     -e BLOB_READ_WRITE_TOKEN=your_token \
     storybook-app
   ```

3. **Test the deployment:**
   ```bash
   curl http://localhost:3000/api/health
   ```

### Docker Compose (Development)

Create `docker-compose.yml` for local development:

```yaml
version: '3.8'

services:
  storybook-app:
    build: 
      context: .
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - LEONARDO_API_KEY=${LEONARDO_API_KEY}
      - BLOB_READ_WRITE_TOKEN=${BLOB_READ_WRITE_TOKEN}
    restart: unless-stopped

networks:
  default:
    name: storybook-network
```

Run with: `docker-compose up -d`

## Google Cloud Run Deployment

### Manual Deployment

1. **Configure Google Cloud CLI:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   gcloud config set run/region us-central1
   ```

2. **Build and push to Container Registry:**
   ```bash
   # Build and tag
   docker build -t gcr.io/YOUR_PROJECT_ID/storybook-app .
   
   # Push to registry
   docker push gcr.io/YOUR_PROJECT_ID/storybook-app
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy storybook-app \
     --image gcr.io/YOUR_PROJECT_ID/storybook-app \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 3000 \
     --memory 2Gi \
     --cpu 1 \
     --max-instances 10 \
     --set-env-vars NODE_ENV=production \
     --update-secrets NEXT_PUBLIC_SUPABASE_URL=projects/PROJECT_NUMBER/secrets/SUPABASE_URL:latest \
     --update-secrets NEXT_PUBLIC_SUPABASE_ANON_KEY=projects/PROJECT_NUMBER/secrets/SUPABASE_ANON_KEY:latest \
     --update-secrets OPENROUTER_API_KEY=projects/PROJECT_NUMBER/secrets/OPENROUTER_API_KEY:latest \
     --update-secrets LEONARDO_API_KEY=projects/PROJECT_NUMBER/secrets/LEONARDO_API_KEY:latest \
     --update-secrets BLOB_READ_WRITE_TOKEN=projects/PROJECT_NUMBER/secrets/BLOB_READ_WRITE_TOKEN:latest
   ```

### Automated Deployment with Cloud Build

The repository includes `cloudbuild.yaml` for automated CI/CD:

#### Cloud Build Configuration

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    entrypoint: 'bash'
    args: 
      - '-c'
      - |
        docker build \
          -t gcr.io/PROJECT_ID/storybook-app:${_TAG} \
          -t gcr.io/PROJECT_ID/storybook-app:latest \
          --build-arg NEXT_PUBLIC_SUPABASE_URL=$$SUPABASE_URL \
          --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$$SUPABASE_ANON_KEY \
          .
    secretEnv:
      - 'SUPABASE_URL'
      - 'SUPABASE_ANON_KEY'

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/PROJECT_ID/storybook-app:${_TAG}']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'storybook-app'
      - '--image'
      - 'gcr.io/PROJECT_ID/storybook-app:${_TAG}'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--port'
      - '3000'
      - '--memory'
      - '2Gi'
      - '--cpu'
      - '1'
      - '--max-instances'
      - '10'
      - '--set-env-vars'
      - 'NODE_ENV=production'
      # Secret configurations...
```

#### Setup Automated Deployment

1. **Create Cloud Build trigger:**
   ```bash
   gcloud builds triggers create github \
     --repo-name=storybook-app \
     --repo-owner=your-github-username \
     --branch-pattern="^main$" \
     --build-config=cloudbuild.yaml \
     --substitutions=_TAG=v1.0
   ```

2. **Grant permissions to Cloud Build:**
   ```bash
   # Get Cloud Build service account
   PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
   
   # Grant Cloud Run deploy permissions
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
     --role="roles/run.admin"
   
   # Grant service account permissions
   gcloud iam service-accounts add-iam-policy-binding \
     ${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
     --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   ```

3. **Deploy by pushing to main branch:**
   ```bash
   git push origin main
   ```

### Cloud Run Configuration

#### Service Configuration

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: storybook-app
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        autoscaling.knative.dev/minScale: "0"
        run.googleapis.com/memory: "2Gi"
        run.googleapis.com/cpu: "1"
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/PROJECT_ID/storybook-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        # Secrets are injected via Cloud Run deployment
```

#### Scaling Configuration

- **Min instances**: 0 (cost optimization)
- **Max instances**: 10 (prevent runaway scaling)
- **CPU**: 1 vCPU per instance
- **Memory**: 2GB per instance (required for AI processing)
- **Concurrency**: 100 requests per instance
- **Timeout**: 300 seconds (accommodates AI generation time)

## Alternative Deployment Methods

### Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Configure environment variables in Vercel dashboard**

**Note**: Vercel deployment may have limitations with Leonardo AI generation due to serverless function timeouts.

### Railway Deployment

1. **Connect GitHub repository to Railway**
2. **Configure environment variables**
3. **Deploy automatically on git push**

**Railway Config:**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"

[env]
NODE_ENV = "production"
```

### AWS ECS Deployment

1. **Create ECS cluster**
2. **Build and push Docker image to ECR**
3. **Create task definition**
4. **Deploy service**

Example task definition:
```json
{
  "family": "storybook-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "storybook-app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/storybook-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "NEXT_PUBLIC_SUPABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:supabase-url"
        }
      ]
    }
  ]
}
```

## Production Configuration

### Security Considerations

1. **HTTPS Only**: Enforce HTTPS in production
2. **Environment Separation**: Use separate Supabase projects for staging/production
3. **API Key Rotation**: Regular rotation of AI service API keys
4. **Access Logging**: Enable access logs for monitoring
5. **Rate Limiting**: Implement at load balancer level

### Performance Optimization

1. **CDN Configuration**: Use Cloud CDN for static assets
2. **Caching Headers**: Set appropriate cache headers
3. **Image Optimization**: Enable Next.js image optimization
4. **Database Indexing**: Ensure proper Supabase indexes
5. **Connection Pooling**: Configure Supabase connection pooling

### Monitoring and Alerts

1. **Cloud Run Metrics**: Monitor CPU, memory, request latency
2. **Custom Metrics**: Track story generation success rates
3. **Error Tracking**: Implement error monitoring (Sentry)
4. **Uptime Monitoring**: External monitoring service
5. **Cost Alerts**: Set up billing alerts

### Health Checks

Create a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
}
```

Configure Cloud Run health check:
```bash
gcloud run services update storybook-app \
  --region us-central1 \
  --health-check-path /api/health
```

## Monitoring and Maintenance

### Logging

Cloud Run automatically captures application logs. Configure structured logging:

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({ 
      level: 'error', 
      message, 
      error: error?.message,
      stack: error?.stack,
      ...meta,
      timestamp: new Date().toISOString()
    }));
  }
};
```

### Monitoring Dashboard

Key metrics to monitor:
- Request latency (p50, p95, p99)
- Error rate
- AI service success rate
- Database connection health
- Memory and CPU usage
- Cost per request

### Maintenance Tasks

**Weekly:**
- Review error logs
- Check AI service quotas
- Monitor costs
- Update dependencies (security patches)

**Monthly:**
- Review and rotate API keys
- Analyze usage patterns
- Update documentation
- Performance optimization review

**Quarterly:**
- Major dependency updates
- Security audit
- Disaster recovery testing
- Cost optimization review

## Troubleshooting

### Common Issues

#### 1. Container Startup Failures

**Symptoms:**
- Service returns 503 errors
- Container exits immediately

**Diagnosis:**
```bash
# Check Cloud Run logs
gcloud run services logs tail storybook-app --region us-central1

# Check build logs
gcloud builds log BUILD_ID
```

**Solutions:**
- Verify all required environment variables are set
- Check build context and Dockerfile syntax
- Ensure port 3000 is correctly exposed

#### 2. AI Service Failures

**Symptoms:**
- Story generation returns fallback content
- Image generation fails silently

**Diagnosis:**
- Check API key validity
- Verify service quotas
- Monitor external service status

**Solutions:**
- Rotate API keys
- Implement better error handling
- Add monitoring for external services

#### 3. Database Connection Issues

**Symptoms:**
- Authentication failures
- Query timeouts

**Diagnosis:**
- Check Supabase project status
- Verify connection strings
- Review Row Level Security policies

**Solutions:**
- Update connection configuration
- Review and fix RLS policies
- Enable connection pooling

#### 4. File Upload Issues

**Symptoms:**
- Upload failures
- Large files not processing

**Diagnosis:**
- Check Vercel Blob quota
- Verify token permissions
- Review file size limits

**Solutions:**
- Increase storage quota
- Update token permissions
- Implement file compression

### Debugging Commands

```bash
# View service configuration
gcloud run services describe storybook-app --region us-central1

# Check recent deployments
gcloud run revisions list --service storybook-app --region us-central1

# View live logs
gcloud run services logs tail storybook-app --region us-central1

# Check Cloud Build history
gcloud builds list --limit 10

# Test connectivity
curl -H "User-Agent: GoogleHC/1.0" https://your-service-url.run.app/api/health
```

### Performance Debugging

1. **Enable Next.js bundle analyzer:**
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ANALYZE=true npm run build
   ```

2. **Profile API endpoints:**
   ```typescript
   // Add timing to API routes
   const start = Date.now();
   // ... API logic
   console.log(`API ${pathname} took ${Date.now() - start}ms`);
   ```

3. **Monitor external service performance:**
   ```typescript
   // Track AI service response times
   const start = Date.now();
   const response = await fetch(aiEndpoint, options);
   const duration = Date.now() - start;
   logger.info('AI service call', { service: 'openrouter', duration, success: response.ok });
   ```

---

This deployment guide provides comprehensive instructions for deploying the StoryBook Creator application in production environments. For additional support, refer to the main documentation or create an issue in the project repository.