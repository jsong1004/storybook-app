# Docker Setup for Storybook App

## Quick Start

1. **Environment variables are already configured** in `.env.local`
   - If you need to modify API keys, edit `.env.local` directly
   - For new setups, copy `.env.example` to `.env.local` and add your keys

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Access the app:**
   - Open http://localhost:3000

## Environment Variables

Your `.env.local` file should contain these required variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys
OPENROUTER_API_KEY=your_openrouter_api_key
LEONARDO_API_KEY=your_leonardo_api_key

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

## Docker Commands

### Development
```bash
# Build and start services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f storybook-app

# Stop services
docker-compose down
```

### Production with Nginx
```bash
# Run with nginx proxy (requires nginx.conf)
docker-compose --profile production up --build
```

### Maintenance
```bash
# Rebuild without cache
docker-compose build --no-cache

# Remove containers and volumes
docker-compose down -v

# View container status
docker-compose ps
```

## Health Check

The container includes a health check that verifies the app is responding on port 3000. You can check the health status:

```bash
docker-compose ps
```

## Troubleshooting

1. **Port conflicts:** Change the port mapping in docker-compose.yml if port 3000 is busy
2. **Build errors:** Ensure all environment variables are set correctly
3. **Memory issues:** The multi-stage build optimizes image size, but ensure Docker has sufficient memory allocated