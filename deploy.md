# GCP Cloud Build Deployment Guide

## Prerequisites

1. **Enable required APIs:**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

2. **Create secrets in Secret Manager:**
   ```bash
   # Create secrets (replace with your actual values)
   echo "your_supabase_url" | gcloud secrets create SUPABASE_URL --data-file=-
   echo "your_supabase_anon_key" | gcloud secrets create SUPABASE_ANON_KEY --data-file=-
   echo "your_openrouter_key" | gcloud secrets create OPENROUTER_API_KEY --data-file=-
   echo "your_leonardo_key" | gcloud secrets create LEONARDO_API_KEY --data-file=-
   echo "your_blob_token" | gcloud secrets create BLOB_READ_WRITE_TOKEN --data-file=-
   ```

3. **Grant Cloud Build access to secrets:**
   ```bash
   # Get Cloud Build service account
   PROJECT_NUMBER=$(gcloud projects describe myresume-457817 --format="value(projectNumber)")
   
   # Grant Secret Manager Secret Accessor role
   gcloud projects add-iam-policy-binding myresume-457817 \
     --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   
   # Grant Cloud Run Admin role
   gcloud projects add-iam-policy-binding myresume-457817 \
     --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
     --role="roles/run.admin"
   
   # Grant Service Account User role
   gcloud projects add-iam-policy-binding myresume-457817 \
     --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   ```

## Deployment Commands

### Manual Deployment
```bash
# Set project
gcloud config set project myresume-457817

# Submit build
gcloud builds submit --config cloudbuild.yaml .
```

### Automated Deployment (GitHub Integration)
```bash
# Connect repository to Cloud Build
gcloud builds triggers create github \
  --repo-name=storybook-app \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --name=storybook-app-trigger
```

## Configuration Details

- **Project ID:** myresume-457817
- **Region:** us-central1
- **Service Name:** storybook-app
- **Memory:** 2Gi
- **CPU:** 1 vCPU
- **Max Instances:** 10
- **Port:** 3000

## Accessing Your App

After deployment, your app will be available at:
```
https://storybook-app-[HASH]-uc.a.run.app
```

The exact URL will be displayed in the Cloud Build logs or you can find it in the Cloud Run console.

## Monitoring

- **Logs:** `gcloud run services logs tail storybook-app --region=us-central1`
- **Console:** https://console.cloud.google.com/run/detail/us-central1/storybook-app

## Updating Secrets

To update secrets:
```bash
echo "new_value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

The next deployment will automatically use the latest version.