# API Documentation

## Overview

The StoryBook Creator API provides endpoints for image upload, story generation, and AI illustration creation. All endpoints require user authentication via Supabase Auth.

## Authentication

All API endpoints require a valid Supabase session. Include the authentication token in your requests:

```javascript
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
// User must be authenticated
```

## Endpoints

### POST /api/upload

Upload images to Vercel Blob storage for story creation.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: FormData with `file` field

**Validation:**
- File must be an image (image/*)
- Maximum file size: 10MB
- User must be authenticated

**Response:**
```json
{
  "url": "https://blob-url.vercel-storage.app/filename.jpg"
}
```

**Error Responses:**
- `401` - Unauthorized (no valid session)
- `400` - No file provided or invalid file type
- `413` - File too large (>10MB)
- `503` - Upload service unavailable
- `500` - General upload error

**Implementation Details:**
- Uses Vercel Blob with `addRandomSuffix: true`
- Saves metadata to `uploaded_images` table
- Public access for generated blob URLs

---

### POST /api/generate-story

Generate AI-powered stories from uploaded images.

**Request:**
```json
{
  "images": ["https://image1-url.com", "https://image2-url.com"]
}
```

**Validation:**
- `images` array is required and non-empty
- User must be authenticated
- Images should be accessible URLs

**Response:**
```json
{
  "storyId": "uuid-v4-story-id",
  "title": "Generated Story Title"
}
```

**Error Responses:**
- `401` - Unauthorized
- `400` - No images provided
- `500` - Story generation failed

**AI Integration:**
- **Primary**: OpenRouter API with Gemini 2.0 Flash model
- **Fallback**: Pre-written family-friendly stories
- **Prompt**: Optimized for children's content, 3-5 paragraphs
- **Content Guidelines**: 
  - Family-friendly and age-appropriate
  - Themes: friendship, adventure, kindness, wonder
  - Engaging narratives with descriptive language

**Background Processing:**
- Triggers `/api/generate-images` asynchronously
- Continues even if image generation fails
- Uses internal fetch with forwarded cookies for auth

**Database Operations:**
- Saves to `stories` table with user association
- Extracts title from first line of generated content
- Links cover image to first uploaded image

---

### POST /api/generate-images

Generate AI illustrations for existing stories (Background process).

**Request:**
```json
{
  "storyId": "uuid-v4-story-id",
  "storyContent": "Full story text content",
  "storyTitle": "Story Title"
}
```

**Validation:**
- Story must exist and belong to authenticated user
- `storyId` and `storyContent` are required

**Response:**
```json
{
  "success": true,
  "imagesGenerated": 3,
  "images": [
    {
      "id": "uuid",
      "story_id": "uuid",
      "image_url": "https://blob-url.com/image.png",
      "prompt": "Generated prompt text",
      "page_number": 1
    }
  ]
}
```

**AI Image Generation:**
- **Service**: Leonardo AI with Flux Precision (Dev) model  
- **Resolution**: 1024x1024 pixels
- **Style**: Children's book illustration, vibrant colors
- **Count**: 2-3 images per story (beginning, middle, end)
- **Enhancement**: Automatic prompt enhancement for improved results

**Prompt Generation Strategy:**
```javascript
// Extracts key scenes from story sentences
// Creates themed prompts:
// 1. Opening scene - magical atmosphere
// 2. Middle action - bright and cheerful  
// 3. Resolution - happy and uplifting
```

**Processing Flow:**
1. **Prompt Generation**: Extract 2-3 key scenes from story
2. **Image Generation**: Call Leonardo AI with scene-specific prompts
3. **Polling**: Wait for completion (max 5 minutes, 10s intervals)
4. **Storage**: Upload to Vercel Blob for permanent storage
5. **Database**: Save metadata to `story_images` table

**Error Handling:**
- **Leonardo AI Failures**: Falls back to placeholder images
- **Timeout**: 30 attempts (5 minutes) then fails gracefully
- **Storage Failures**: Logs error but continues processing
- **Partial Success**: Returns count of successful generations

---

## Data Models

### Uploaded Images
```sql
uploaded_images {
  id: UUID (primary key)
  user_id: UUID (foreign key)
  image_url: TEXT (Vercel Blob URL)
  original_filename: TEXT
  created_at: TIMESTAMP
}
```

### Stories
```sql
stories {
  id: UUID (primary key)
  user_id: UUID (foreign key)
  title: TEXT (max 100 chars)
  content: TEXT (full story)
  cover_image_url: TEXT (first uploaded image)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### Story Images
```sql
story_images {
  id: UUID (primary key)
  story_id: UUID (foreign key)
  image_url: TEXT (generated illustration)
  prompt: TEXT (AI generation prompt)
  page_number: INTEGER (sequence)
  created_at: TIMESTAMP
}
```

## Error Handling

### Common Patterns
- **Authentication**: All endpoints return 401 for unauthenticated requests
- **Validation**: Input validation with descriptive error messages
- **Graceful Degradation**: Fallbacks when AI services unavailable
- **Rate Limiting**: Implement client-side throttling for AI endpoints

### API Service Dependencies
- **Supabase**: Database operations and authentication
- **Vercel Blob**: File storage and CDN
- **OpenRouter**: AI story generation (optional with fallback)
- **KlingAI**: AI illustration generation (optional with placeholder)

### Environment Variables Required
```env
# Core Services
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# AI Services (Optional)
OPENROUTER_API_KEY=your_openrouter_key
LEONARDO_API_KEY=your_leonardo_api_key
```

## Usage Examples

### Complete Story Creation Flow

```javascript
// 1. Upload images
const formData = new FormData()
formData.append('file', file)

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})
const { url } = await uploadResponse.json()

// 2. Generate story
const storyResponse = await fetch('/api/generate-story', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ images: [url] })
})
const { storyId, title } = await storyResponse.json()

// 3. Images generate automatically in background
// Navigate to /story/${storyId} to view
```

## Rate Limits & Quotas

- **Upload**: 10MB per file, 5 files per story
- **Generation**: Story generation ~30s, Image generation ~5min
- **Storage**: Unlimited via Vercel Blob (paid service)
- **AI Costs**: Based on OpenRouter and Leonardo AI usage