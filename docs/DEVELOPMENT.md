# Development Guide & Best Practices

## Overview

This guide covers development workflows, coding standards, and best practices for the StoryBook Creator application. Follow these guidelines to maintain code quality, security, and team collaboration.

## Development Workflow

### Getting Started

1. **Environment Setup**
   ```bash
   # Clone and install
   git clone <repository-url>
   cd storybook-app
   pnpm install
   
   # Environment configuration
   cp .env.local.example .env.local
   # Configure all required environment variables
   ```

2. **Database Setup**
   ```bash
   # In Supabase dashboard, run migration scripts:
   # 1. scripts/001_create_tables.sql
   # 2. scripts/002_profile_trigger.sql
   ```

3. **Development Server**
   ```bash
   pnpm dev    # Start development server
   pnpm build  # Production build test
   pnpm lint   # Code quality check
   ```

### Branch Strategy

```
main           # Production-ready code
├── develop    # Integration branch
├── feature/*  # Feature development
├── bugfix/*   # Bug fixes
└── hotfix/*   # Production hotfixes
```

### Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add AI story generation endpoint
fix: resolve image upload compression issue
docs: update API documentation
refactor: simplify component architecture
test: add upload component tests
chore: update dependencies
```

## Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// ✅ Good - Explicit interface definitions
interface StoryData {
  id: string
  title: string
  content: string
  coverImageUrl: string | null
  createdAt: Date
}

// ✅ Good - Generic types for reusability
interface ApiResponse<T> {
  data: T
  error: string | null
}

// ❌ Avoid - Any types
function processData(data: any): any {
  return data.something
}

// ✅ Good - Proper typing
function processData(data: StoryData): ProcessedStory {
  return {
    id: data.id,
    displayTitle: data.title.toUpperCase()
  }
}
```

#### Error Handling
```typescript
// ✅ Good - Explicit error handling
async function uploadImage(file: File): Promise<UploadResult> {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Upload failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload image')
  }
}
```

### React Component Patterns

#### Server vs Client Components
```typescript
// ✅ Server Component (default in app directory)
export default async function StoriesPage() {
  const supabase = await createClient()
  const stories = await supabase.from('stories').select('*')
  
  return <StoriesGrid stories={stories} />
}

// ✅ Client Component (interactive)
'use client'
export default function CreateStoryForm() {
  const [images, setImages] = useState<UploadedImage[]>([])
  
  return (
    <form onSubmit={handleSubmit}>
      <ImageUpload onImagesUploaded={setImages} />
    </form>
  )
}
```

#### Component Composition
```typescript
// ✅ Good - Composition pattern
function StoryCard({ story }: { story: Story }) {
  return (
    <Card>
      <Card.Header>
        <CardTitle>{story.title}</CardTitle>
      </Card.Header>
      <Card.Content>
        <p>{story.content}</p>
      </Card.Content>
    </Card>
  )
}

// ✅ Good - Props interface
interface ImageUploadProps {
  onImagesUploaded: (images: UploadedImage[]) => void
  maxImages?: number
  className?: string
}

export function ImageUpload({ 
  onImagesUploaded, 
  maxImages = 5,
  className 
}: ImageUploadProps) {
  // Implementation
}
```

### API Development

#### Route Handler Pattern
```typescript
// app/api/example/route.ts
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Input validation
    const body = await request.json()
    const validatedData = schema.parse(body) // Use Zod validation

    // 3. Business logic
    const result = await processData(validatedData)

    // 4. Response
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
```

#### Database Operations
```typescript
// ✅ Good - Proper error handling and types
async function createStory(data: CreateStoryData): Promise<Story> {
  const supabase = createClient()
  
  const { data: story, error } = await supabase
    .from('stories')
    .insert({
      user_id: data.userId,
      title: data.title,
      content: data.content,
      cover_image_url: data.coverImageUrl
    })
    .select()
    .single()

  if (error) {
    console.error('Database error:', error)
    throw new Error('Failed to create story')
  }

  return story
}
```

## Security Best Practices

### Authentication & Authorization

#### Row Level Security
```sql
-- ✅ Good - Proper RLS policy
CREATE POLICY "users_own_stories" ON stories
FOR SELECT USING (auth.uid() = user_id);

-- ✅ Good - Secure function
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges
SET search_path = public  -- Prevent injection
```

#### API Security
```typescript
// ✅ Good - Always validate user ownership
async function getStory(storyId: string, userId: string): Promise<Story> {
  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .eq('user_id', userId)  // ← Critical security check
    .single()

  if (error) throw new Error('Story not found')
  return story
}
```

### Input Validation
```typescript
import { z } from 'zod'

// ✅ Good - Zod validation schemas
const CreateStorySchema = z.object({
  images: z.array(z.string().url()).min(1).max(5),
  title: z.string().min(1).max(100).optional()
})

// Usage in API route
const validatedData = CreateStorySchema.parse(requestBody)
```

### Environment Variables
```bash
# ✅ Good - Secure environment setup
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ Never commit these secrets
OPENROUTER_API_KEY=sk_or_v1_xxx
PIAPI_API_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Performance Optimization

### Image Handling
```typescript
// ✅ Good - Client-side compression before upload
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()

    img.onload = () => {
      // Calculate optimal dimensions
      const maxWidth = 1920
      const maxHeight = 1080
      const quality = 0.8

      // Resize and compress
      canvas.toBlob(resolve, file.type, quality)
    }
  })
}
```

### Database Query Optimization
```typescript
// ✅ Good - Efficient queries with proper indexing
const stories = await supabase
  .from('stories')
  .select(`
    id,
    title,
    cover_image_url,
    created_at,
    story_images!inner(count)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20)
```

### Component Performance
```typescript
// ✅ Good - Memoization for expensive calculations
const processedImages = useMemo(() => {
  return images.map(img => ({
    ...img,
    thumbnail: generateThumbnail(img.url)
  }))
}, [images])

// ✅ Good - Callback memoization
const handleImageUpload = useCallback(
  (newImages: UploadedImage[]) => {
    setImages(prev => [...prev, ...newImages])
    onImagesChange?.(newImages)
  },
  [onImagesChange]
)
```

## Testing Strategy

### Unit Testing
```typescript
// components/__tests__/ImageUpload.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageUpload } from '../ImageUpload'

describe('ImageUpload', () => {
  it('should handle file uploads', async () => {
    const mockOnUpload = jest.fn()
    render(<ImageUpload onImagesUploaded={mockOnUpload} />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText(/choose images/i)
    
    fireEvent.change(input, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith([
        expect.objectContaining({ filename: 'test.jpg' })
      ])
    })
  })
})
```

### Integration Testing
```typescript
// app/api/__tests__/upload.test.ts
import { POST } from '../upload/route'
import { createMocks } from 'node-mocks-http'

describe('/api/upload', () => {
  it('should upload images successfully', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: formData,
      headers: { 'content-type': 'multipart/form-data' }
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
  })
})
```

## Error Handling & Logging

### Client-Side Error Handling
```typescript
// ✅ Good - User-friendly error handling
async function generateStory(images: string[]) {
  try {
    setLoading(true)
    
    const response = await fetch('/api/generate-story', {
      method: 'POST',
      body: JSON.stringify({ images })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Generation failed')
    }

    const result = await response.json()
    router.push(`/story/${result.storyId}`)
  } catch (error) {
    console.error('Story generation error:', error)
    
    toast({
      title: 'Generation failed',
      description: 'Please try again or contact support if the issue persists.',
      variant: 'destructive'
    })
  } finally {
    setLoading(false)
  }
}
```

### Server-Side Logging
```typescript
// ✅ Good - Structured logging
import { createLogger } from './lib/logger'

const logger = createLogger('api:generate-story')

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  logger.info('Story generation started', { 
    requestId,
    userId: user.id,
    imageCount: images.length 
  })

  try {
    // Processing...
    logger.info('Story generated successfully', { 
      requestId, 
      storyId: result.id 
    })
  } catch (error) {
    logger.error('Story generation failed', { 
      requestId, 
      error: error.message,
      stack: error.stack 
    })
  }
}
```

## Deployment & CI/CD

### Build Optimization
```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle analyzer
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
  
  // Image optimization
  images: {
    domains: ['blob.vercel-storage.com', 'supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

export default nextConfig
```

### Environment Management
```bash
# Development
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NODE_ENV=development

# Staging  
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NODE_ENV=production

# Production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NODE_ENV=production
```

### Health Checks
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    ai_services: await checkAIServices()
  }
  
  const healthy = Object.values(checks).every(check => check.status === 'ok')
  
  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks },
    { status: healthy ? 200 : 503 }
  )
}
```

## Code Review Guidelines

### Pull Request Checklist

- [ ] Code follows TypeScript and React conventions
- [ ] All functions have proper error handling
- [ ] API routes include authentication checks
- [ ] Database queries use proper typing
- [ ] Tests cover new functionality
- [ ] Performance implications considered
- [ ] Security implications reviewed
- [ ] Documentation updated if needed

### Review Focus Areas

1. **Security**: Authentication, authorization, input validation
2. **Performance**: Query efficiency, bundle size, runtime performance
3. **Maintainability**: Code clarity, proper abstractions, documentation
4. **User Experience**: Error handling, loading states, accessibility
5. **Testing**: Coverage, edge cases, integration points

## Common Pitfalls & Solutions

### Authentication Issues
```typescript
// ❌ Problem - Not checking user ownership
const story = await getStoryById(storyId)

// ✅ Solution - Always verify ownership
const story = await getStoryById(storyId, userId)
```

### Memory Leaks
```typescript
// ❌ Problem - Missing cleanup
useEffect(() => {
  const subscription = api.subscribe(callback)
  // Missing cleanup
}, [])

// ✅ Solution - Proper cleanup
useEffect(() => {
  const subscription = api.subscribe(callback)
  return () => subscription.unsubscribe()
}, [callback])
```

### Error Boundaries
```typescript
// ✅ Good - Global error boundary
export default function GlobalErrorBoundary({ 
  error, 
  reset 
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="error-boundary">
      <h2>Something went wrong</h2>
      <details>{error.message}</details>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## Development Tools

### Recommended Extensions
- **ESLint** - Code quality
- **Prettier** - Code formatting  
- **TypeScript** - Type checking
- **Tailwind CSS IntelliSense** - Style assistance
- **Thunder Client** - API testing

### Useful Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "analyze": "ANALYZE=true next build"
  }
}
```

This development guide ensures consistent, secure, and maintainable code across the StoryBook Creator application.