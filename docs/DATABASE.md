# Database Schema & Architecture

## Overview

The StoryBook Creator uses **Supabase PostgreSQL** as the primary database with **Row Level Security (RLS)** for multi-tenant data isolation. The schema is designed for scalable story creation with user authentication and AI-generated content management.

## Database Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   auth.users    │    │   public.profiles │    │ public.stories  │
│  (Supabase)     │◄──►│                 │◄──►│                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │uploaded_images  │    │  story_images   │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
```

## Core Tables

### 1. profiles
**Purpose**: User profile information and display preferences

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Relationships**:
- `id` → `auth.users.id` (1:1, CASCADE DELETE)

**Indexes**:
- Primary key on `id`
- Automatic indexing on foreign keys

**Row Level Security**:
- Users can only access their own profile data
- INSERT/UPDATE/DELETE restricted to profile owner

### 2. stories
**Purpose**: AI-generated story content and metadata

```sql
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Field Details**:
- `title`: Story title (max 100 characters)
- `content`: Full story text content
- `cover_image_url`: First uploaded image used as cover

**Relationships**:
- `user_id` → `auth.users.id` (N:1, CASCADE DELETE)
- `cover_image_url` → Vercel Blob storage (external)

**Row Level Security**:
- Users can only access their own stories
- Full CRUD permissions for story owners

### 3. story_images
**Purpose**: AI-generated illustrations linked to stories

```sql
CREATE TABLE public.story_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT,
  page_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Field Details**:
- `prompt`: AI prompt used to generate the image
- `page_number`: Sequence position in story (1-based)
- `image_url`: Vercel Blob storage URL

**Relationships**:
- `story_id` → `stories.id` (N:1, CASCADE DELETE)

**Row Level Security**:
- Access controlled through story ownership
- Users can only see images for their own stories

### 4. uploaded_images
**Purpose**: User-uploaded source images for story creation

```sql
CREATE TABLE public.uploaded_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  original_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Field Details**:
- `image_url`: Vercel Blob storage URL
- `original_filename`: User's original file name

**Relationships**:
- `user_id` → `auth.users.id` (N:1, CASCADE DELETE)

**Row Level Security**:
- Users can only access their own uploaded images
- No UPDATE permissions (immutable after creation)

## Security Model

### Row Level Security (RLS)

All public tables have RLS enabled with user-scoped policies:

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;
```

### Policy Patterns

#### Direct User Association
```sql
-- For tables with direct user_id foreign key
CREATE POLICY "table_select_own" ON public.table 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "table_insert_own" ON public.table 
FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### Indirect Association
```sql
-- For story_images (accessed through story ownership)
CREATE POLICY "story_images_select_own" ON public.story_images 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_images.story_id 
    AND stories.user_id = auth.uid()
  )
);
```

### Authentication Flow

1. **Supabase Auth** manages user sessions and JWTs
2. **auth.users** table contains core authentication data
3. **Trigger Function** auto-creates profile on signup
4. **RLS Policies** enforce data isolation using `auth.uid()`

## Database Triggers

### Auto Profile Creation

**File**: `scripts/002_profile_trigger.sql`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'display_name', 'Anonymous User')
  );
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Purpose**:
- Automatically creates profile when user signs up
- Extracts display name from auth metadata
- Falls back to "Anonymous User" if no name provided

## Data Relationships

### Entity Relationship Diagram

```
auth.users (1) ──────── (1) profiles
    │
    │ (1)
    │
    ▼ (N)
  stories ────────────── (N) story_images
    │
    │ (covers)
    │
    ▼ (1)
cover_image_url

auth.users (1) ──────── (N) uploaded_images
```

### Relationship Details

1. **User ↔ Profile**: 1:1, created automatically on signup
2. **User ↔ Stories**: 1:N, user can create multiple stories
3. **Story ↔ Story Images**: 1:N, each story can have multiple illustrations
4. **User ↔ Uploaded Images**: 1:N, user can upload multiple source images
5. **Story ↔ Cover Image**: N:1, cover references uploaded image URL

## Query Patterns

### Common Queries

#### Get User Stories with Cover Images
```sql
SELECT 
  s.id,
  s.title,
  s.cover_image_url,
  s.created_at,
  COUNT(si.id) as image_count
FROM stories s
LEFT JOIN story_images si ON s.id = si.story_id
WHERE s.user_id = auth.uid()
GROUP BY s.id, s.title, s.cover_image_url, s.created_at
ORDER BY s.created_at DESC;
```

#### Get Story with All Generated Images
```sql
SELECT 
  s.*,
  json_agg(
    json_build_object(
      'id', si.id,
      'image_url', si.image_url,
      'page_number', si.page_number,
      'prompt', si.prompt
    ) ORDER BY si.page_number
  ) as images
FROM stories s
LEFT JOIN story_images si ON s.id = si.story_id
WHERE s.id = $1 AND s.user_id = auth.uid()
GROUP BY s.id;
```

#### Get User Upload History
```sql
SELECT 
  ui.id,
  ui.image_url,
  ui.original_filename,
  ui.created_at,
  COUNT(CASE WHEN s.cover_image_url = ui.image_url THEN 1 END) as used_in_stories
FROM uploaded_images ui
LEFT JOIN stories s ON s.cover_image_url = ui.image_url AND s.user_id = ui.user_id
WHERE ui.user_id = auth.uid()
GROUP BY ui.id, ui.image_url, ui.original_filename, ui.created_at
ORDER BY ui.created_at DESC;
```

## Performance Optimization

### Indexing Strategy

#### Automatic Indexes
- Primary keys (UUID)
- Foreign key constraints
- Unique constraints

#### Recommended Additional Indexes
```sql
-- For story listing queries
CREATE INDEX idx_stories_user_created ON stories(user_id, created_at DESC);

-- For story image ordering
CREATE INDEX idx_story_images_story_page ON story_images(story_id, page_number);

-- For upload history
CREATE INDEX idx_uploaded_images_user_created ON uploaded_images(user_id, created_at DESC);
```

### Query Optimization

#### Best Practices
- Use `auth.uid()` function for RLS-aware queries
- Limit result sets with appropriate LIMIT clauses
- Use JSON aggregation for related data
- Avoid N+1 queries with JOIN operations

## Data Migration & Deployment

### Migration Scripts

**Order of Execution**:
1. `001_create_tables.sql` - Core schema and RLS policies
2. `002_profile_trigger.sql` - Auto-profile creation

**Deployment Process**:
```bash
# In Supabase Dashboard SQL Editor
# 1. Run 001_create_tables.sql
# 2. Run 002_profile_trigger.sql
# 3. Verify policies with test queries
```

### Environment Considerations

#### Development
- Use Supabase local development
- Seed data for testing scenarios
- Mock external services (Vercel Blob)

#### Production
- Enable connection pooling
- Configure backup schedules
- Monitor query performance
- Set up alerting for errors

## Backup & Recovery

### Automated Backups
- **Supabase Pro**: Daily automatic backups
- **Point-in-time Recovery**: 7-day retention
- **Manual Backups**: On-demand snapshots

### Data Export
```sql
-- Export user data (GDPR compliance)
SELECT 
  p.*,
  json_agg(s.*) as stories
FROM profiles p
LEFT JOIN stories s ON s.user_id = p.id
WHERE p.id = $user_id
GROUP BY p.id;
```

### Disaster Recovery
- Cross-region replication available
- Export/import tools for migration
- Schema versioning for rollback

## Future Enhancements

### Planned Schema Updates
- **Story Sharing**: Public sharing with privacy controls
- **Story Collections**: User-defined story groups
- **Version History**: Story edit history and rollback
- **Collaboration**: Multi-user story editing
- **Analytics**: Usage tracking and insights

### Scalability Considerations
- **Partitioning**: Time-based partitioning for large tables
- **Caching**: Redis caching layer for frequent queries
- **Read Replicas**: Separate read/write database instances
- **CDN Integration**: Image metadata caching