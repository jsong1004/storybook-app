# API Reference

This document provides comprehensive documentation for all API endpoints in the StoryBook Creator application.

## Table of Contents

- [Authentication](#authentication)
- [File Upload API](#file-upload-api)
- [Story Generation API](#story-generation-api)
- [Image Generation API](#image-generation-api)
- [PDF Export API](#pdf-export-api)
- [Story Management API](#story-management-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Authentication

All API endpoints (except public sharing) require user authentication via Supabase Auth. Authentication is handled through HTTP-only cookies containing JWT tokens.

### Authentication Headers

No explicit headers are required. Authentication is handled automatically through secure cookies.

### Authentication Errors

```json
{
  "error": "Unauthorized",
  "code": 401
}
```

---

## File Upload API

Upload user photos to be used for story generation.

### `POST /api/upload`

Uploads an image file to Vercel Blob storage and saves metadata to the database.

#### Request

**Content-Type:** `multipart/form-data`

**Parameters:**
- `file` (File, required): Image file to upload
  - Supported formats: `image/*`
  - Maximum size: 10MB

#### Response

**Success (200):**
```json
{
  "url": "https://blob.vercel-storage.com/path/to/uploaded-image.jpg"
}
```

**Errors:**
- `400`: No file provided or invalid file type
- `401`: User not authenticated
- `413`: File too large (>10MB)
- `503`: Upload service unavailable

#### Example

```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log('Uploaded URL:', data.url);
```

---

## Story Generation API

Generate AI-powered stories from uploaded images with customization options.

### `POST /api/generate-story`

Analyzes uploaded images and generates a personalized story using OpenRouter's Gemini model.

#### Request

**Content-Type:** `application/json`

**Body Parameters:**
- `images` (string[], required): Array of image URLs from upload API
- `customizations` (object, optional): Story customization options

**Customizations Object:**
```typescript
{
  ageGroup?: 'toddlers (2-4)' | 'preschool (4-6)' | 'early readers (6-8)' | 'young readers (8-12)' | 'all ages';
  theme?: 'friendship' | 'adventure' | 'family' | 'nature' | 'magic' | 'learning' | 'kindness' | 'courage';
  length?: 'short' | 'medium' | 'long';
  tone?: 'playful' | 'gentle' | 'exciting' | 'educational';
}
```

#### Response

**Success (200):**
```json
{
  "storyId": "uuid-string",
  "title": "The Magical Adventure"
}
```

**Errors:**
- `400`: No images provided or invalid format
- `401`: User not authenticated
- `500`: Story generation failed

#### Story Content Format

Generated stories use the following format:
- Title on the first line
- Story content divided by `---PAGE BREAK---` markers
- Each page section contains 2-3 sentences
- Content is automatically moderated for child-appropriateness

#### Example

```javascript
const response = await fetch('/api/generate-story', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    images: [
      'https://blob.vercel-storage.com/image1.jpg',
      'https://blob.vercel-storage.com/image2.jpg'
    ],
    customizations: {
      ageGroup: 'preschool (4-6)',
      theme: 'adventure',
      length: 'medium',
      tone: 'playful'
    }
  }),
});

const data = await response.json();
console.log('Story created:', data.storyId);
```

#### Fallback Behavior

When OpenRouter API is unavailable or fails:
- System uses pre-written template stories
- Stories are customized based on provided theme and age group
- Fallback stories maintain the same page break structure

---

## Image Generation API

Generate custom illustrations for story pages using Leonardo AI.

### `POST /api/generate-images`

Creates AI-generated illustrations that match the story content and maintain visual consistency.

#### Request

**Content-Type:** `application/json`

**Body Parameters:**
- `storyId` (string, required): UUID of the story
- `storyContent` (string, required): Full story content with page breaks
- `storyTitle` (string, required): Story title for context

#### Response

**Success (200):**
```json
{
  "success": true,
  "imagesGenerated": 4,
  "images": [
    {
      "id": "uuid",
      "story_id": "story-uuid",
      "image_url": "https://blob.vercel-storage.com/generated-image.png",
      "prompt": "Children's book illustration...",
      "page_number": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Errors:**
- `400`: Missing required parameters
- `401`: User not authenticated
- `404`: Story not found or access denied
- `500`: Image generation failed

#### Image Generation Details

**AI Model:** Leonardo AI Flux Precision (Dev)
**Output Format:** 1024x1024 PNG images
**Processing:** Asynchronous with polling mechanism

**Content Moderation:**
- Automatic filtering of inappropriate words
- Child-friendly prompt alternatives
- Safe fallback prompts for flagged content

**Style Variation:**
- Watercolor, colored pencil, gouache, ink-and-wash styles
- Different compositions per page
- Character and setting consistency hints

#### Example

```javascript
const response = await fetch('/api/generate-images', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    storyId: 'story-uuid-here',
    storyContent: 'Once upon a time...\n---PAGE BREAK---\nThe adventure continued...',
    storyTitle: 'My Magical Story'
  }),
});

const data = await response.json();
console.log(`Generated ${data.imagesGenerated} images`);
```

---

## PDF Export API

Export stories as printable HTML/PDF format.

### `POST /api/download-pdf`

Generates a printable HTML version of the story with embedded images and print-optimized styling.

#### Request

**Content-Type:** `application/json`

**Body Parameters:**
- `storyId` (string, required): UUID of the story
- `title` (string, required): Story title
- `content` (string, required): Story content
- `coverImage` (string, optional): Cover image URL
- `storyImages` (array, optional): Generated story images
- `createdAt` (string, required): Story creation timestamp

#### Response

**Success (200):**
- **Content-Type:** `text/html; charset=utf-8`
- **Content-Disposition:** `inline; filename="story_title.html"`
- **Body:** Complete HTML document with embedded CSS and JavaScript

**Errors:**
- `400`: Missing required parameters
- `401`: User not authenticated (for private stories)
- `404`: Story not found
- `500`: PDF generation failed

#### HTML Features

**Print Optimization:**
- A4 page size with proper margins
- Page breaks between story sections
- Print-friendly styling (removes shadows, adjusts colors)
- Browser print dialog integration

**Layout:**
- Cover page with title, date, and cover image
- Two-column layout for story pages (text + illustration)
- Page numbers and professional typography
- Responsive design for screen preview

#### Example

```javascript
const response = await fetch('/api/download-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    storyId: 'story-uuid',
    title: 'My Adventure',
    content: 'Story content here...',
    coverImage: 'https://blob.vercel-storage.com/cover.jpg',
    storyImages: [
      {
        page_number: 1,
        image_url: 'https://blob.vercel-storage.com/page1.png'
      }
    ],
    createdAt: '2024-01-01T00:00:00Z'
  }),
});

// Response will be HTML content
const htmlContent = await response.text();
// Open in new window for printing
const printWindow = window.open();
printWindow.document.write(htmlContent);
```

---

## Story Management API

Manage user stories (deletion, sharing, etc.).

### `DELETE /api/delete-story`

Permanently deletes a user's story and all associated images.

#### Request

**Content-Type:** `application/json`

**Body Parameters:**
- `storyId` (string, required): UUID of the story to delete

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Story deleted successfully"
}
```

**Errors:**
- `400`: Story ID is required
- `401`: User not authenticated
- `404`: Story not found or access denied
- `500`: Failed to delete story

#### Deletion Process

1. Verifies user authentication
2. Confirms story ownership
3. Deletes associated `story_images` records
4. Deletes the story record
5. Returns success confirmation

#### Example

```javascript
const response = await fetch('/api/delete-story', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    storyId: 'story-uuid-to-delete'
  }),
});

const data = await response.json();
if (data.success) {
  console.log('Story deleted successfully');
}
```

---

## Error Handling

### Error Response Format

All API endpoints use a consistent error response format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE_IF_APPLICABLE",
  "details": {
    "field": "validation error details if applicable"
  }
}
```

### HTTP Status Codes

| Code | Description | Common Usage |
|------|-------------|--------------|
| `200` | Success | Request completed successfully |
| `400` | Bad Request | Invalid parameters or malformed request |
| `401` | Unauthorized | User not authenticated |
| `403` | Forbidden | User lacks permission for resource |
| `404` | Not Found | Resource not found or access denied |
| `413` | Payload Too Large | File upload exceeds size limits |
| `500` | Internal Server Error | Server-side error or AI service failure |
| `503` | Service Unavailable | External service temporarily unavailable |

### Error Handling Best Practices

1. **Always check response status** before processing response body
2. **Handle network errors** with try-catch blocks
3. **Implement retry logic** for temporary failures (503 errors)
4. **Show user-friendly messages** based on error types
5. **Log errors** for debugging purposes

#### Example Error Handling

```javascript
try {
  const response = await fetch('/api/generate-story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    
    switch (response.status) {
      case 400:
        throw new Error(`Invalid request: ${errorData.error}`);
      case 401:
        // Redirect to login
        window.location.href = '/auth/login';
        return;
      case 503:
        // Retry logic for service unavailable
        setTimeout(() => retryRequest(), 5000);
        return;
      default:
        throw new Error(`Server error: ${errorData.error}`);
    }
  }

  const data = await response.json();
  // Handle success
} catch (error) {
  console.error('API Error:', error);
  // Show user-friendly error message
}
```

---

## Rate Limiting

### Current Implementation

Rate limiting is currently implemented through:

1. **Database-level Row Level Security (RLS)**: Ensures users can only access their own data
2. **File size limits**: 10MB maximum per upload
3. **Authentication requirements**: Most endpoints require valid user session

### Future Considerations

Planned rate limiting improvements:
- Request-per-minute limits per user
- API key-based rate limiting for AI services
- Queue system for resource-intensive operations
- Graceful degradation during high load

### Best Practices

1. **Implement exponential backoff** for retries
2. **Cache responses** where appropriate to reduce API calls
3. **Batch requests** when possible
4. **Monitor rate limit headers** (when implemented)
5. **Handle rate limit errors gracefully**

---

## API Client Examples

### JavaScript/TypeScript Client

```typescript
class StoryBookAPI {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async generateStory(
    images: string[], 
    customizations?: StoryCustomizations
  ): Promise<{ storyId: string; title: string }> {
    const response = await fetch(`${this.baseUrl}/api/generate-story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images, customizations }),
    });

    if (!response.ok) {
      throw new Error(`Story generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteStory(storyId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/delete-story`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  }
}

// Usage
const api = new StoryBookAPI();
const uploadResult = await api.uploadImage(imageFile);
const story = await api.generateStory([uploadResult.url]);
```

### Python Client Example

```python
import requests
from typing import List, Optional

class StoryBookAPI:
    def __init__(self, base_url: str = ""):
        self.base_url = base_url
        self.session = requests.Session()

    def upload_image(self, file_path: str) -> dict:
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = self.session.post(
                f"{self.base_url}/api/upload", 
                files=files
            )
            response.raise_for_status()
            return response.json()

    def generate_story(self, images: List[str], customizations: Optional[dict] = None) -> dict:
        data = {
            'images': images,
            'customizations': customizations or {}
        }
        response = self.session.post(
            f"{self.base_url}/api/generate-story",
            json=data
        )
        response.raise_for_status()
        return response.json()

# Usage
api = StoryBookAPI("https://your-domain.com")
upload_result = api.upload_image("photo.jpg")
story = api.generate_story([upload_result['url']])
```

---

This API reference provides complete documentation for integrating with the StoryBook Creator API. For additional support or questions, please refer to the main README or create an issue in the project repository.