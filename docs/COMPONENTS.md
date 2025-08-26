# Component Architecture

## Overview

The StoryBook Creator uses a modern React component architecture built on Next.js 15 with TypeScript. The design system leverages shadcn/ui components for consistency and accessibility.

## Architecture Pattern

```
┌─────────────────────────────────────────┐
│                Pages                    │
│  (app/ router, server components)       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            Custom Components            │
│     (business logic, feature-specific)  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              UI Components              │
│         (shadcn/ui, reusable)          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            Radix Primitives             │
│      (accessibility, behavior)          │
└─────────────────────────────────────────┘
```

## Component Categories

### 1. Pages (app/)
Server and client components that represent full application views.

**Location**: `app/*/page.tsx`

#### Core Pages
- `page.tsx` - Landing page with hero section
- `auth/login/page.tsx` - Authentication interface  
- `create/page.tsx` - Story creation workflow
- `dashboard/page.tsx` - User story management
- `story/[id]/page.tsx` - Individual story viewing

**Common Patterns**:
```typescript
// Server Component Pattern
export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('table').select()
  
  return <ClientComponent data={data} />
}

// Client Component Pattern  
'use client'
export default function ClientPage() {
  const [state, setState] = useState()
  // Interactive functionality
  return <UI />
}
```

### 2. Custom Components (components/)
Feature-specific components with business logic.

#### ImageUpload Component
**File**: `components/image-upload.tsx`

**Purpose**: Multi-image upload with drag-and-drop, compression, and validation.

**Key Features**:
- **Drag & Drop**: React Dropzone integration
- **Image Compression**: Canvas-based compression for files >5MB
- **Validation**: File type, size, and count limits
- **Progress Feedback**: Loading states and toast notifications
- **Authentication**: Supabase auth integration

**Props**:
```typescript
interface ImageUploadProps {
  onImagesUploaded: (images: UploadedImage[]) => void
  maxImages?: number // Default: 5
}

interface UploadedImage {
  id: string
  url: string
  filename: string
}
```

**Implementation Details**:
- Auto-compression for files >5MB using Canvas API
- Dual storage: Vercel Blob + Supabase database
- Error handling with user-friendly messages
- Responsive grid layout for image preview

### 3. UI Components (components/ui/)
Reusable design system components based on shadcn/ui.

#### Button Component
**File**: `components/ui/button.tsx`

**Features**:
- **Variants**: default, destructive, outline, secondary, ghost, link
- **Sizes**: default, sm, lg, icon
- **Accessibility**: Focus rings, disabled states, ARIA support
- **Composition**: Radix Slot for polymorphic behavior

**Usage**:
```typescript
<Button variant="outline" size="lg" asChild>
  <Link href="/create">Get Started</Link>
</Button>
```

#### Complete UI Component Library
Located in `components/ui/`:

**Layout & Structure**:
- `card.tsx` - Content containers with headers/footers
- `separator.tsx` - Visual dividers
- `aspect-ratio.tsx` - Responsive image containers

**Navigation**:
- `button.tsx` - Primary interaction elements
- `navigation-menu.tsx` - Site navigation
- `breadcrumb.tsx` - Hierarchical navigation

**Form Controls**:
- `input.tsx` - Text input fields
- `textarea.tsx` - Multi-line text input
- `select.tsx` - Dropdown selections
- `checkbox.tsx` - Boolean selections
- `radio-group.tsx` - Single-choice selections

**Feedback & Status**:
- `toast.tsx` + `toaster.tsx` - Notification system
- `alert.tsx` - Important messages
- `progress.tsx` - Loading indicators
- `skeleton.tsx` - Loading placeholders

**Overlays**:
- `dialog.tsx` - Modal dialogs
- `sheet.tsx` - Slide-out panels
- `popover.tsx` - Contextual information
- `tooltip.tsx` - Hover information

## State Management

### Client State
- **React useState** - Component-local state
- **React Hook Form** - Form state and validation  
- **Custom Hooks** - Shared state logic

### Server State  
- **Supabase Client** - Database operations
- **Next.js Server Actions** - Form submissions
- **React Query** (Future) - Data fetching and caching

### Global State
- **Supabase Auth** - User authentication state
- **Toast Context** - Notification management

## Data Flow

### Upload Flow
```
User selects files
        ↓
ImageUpload compresses if needed
        ↓
POST /api/upload → Vercel Blob
        ↓
Save metadata to Supabase
        ↓
Update UI with uploaded images
        ↓
Pass to parent component
```

### Story Creation Flow  
```
User submits images
        ↓
CreateStoryPage → /api/generate-story
        ↓
AI processes images → story text
        ↓
Save story to database
        ↓
Background: /api/generate-images
        ↓
Navigate to story view
```

## Component Patterns

### Container/Presentational Pattern
```typescript
// Container (logic)
function StoryContainer({ storyId }: { storyId: string }) {
  const [story, setStory] = useState()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchStory(storyId).then(setStory).finally(() => setLoading(false))
  }, [storyId])
  
  return <StoryDisplay story={story} loading={loading} />
}

// Presentational (UI)
function StoryDisplay({ story, loading }) {
  if (loading) return <Skeleton />
  return <div>{story.content}</div>
}
```

### Compound Component Pattern
```typescript
// Used in Card, Dialog, etc.
function Card({ children }) {
  return <div className="card">{children}</div>
}

Card.Header = function CardHeader({ children }) {
  return <div className="card-header">{children}</div>
}

Card.Content = function CardContent({ children }) {
  return <div className="card-content">{children}</div>
}

// Usage
<Card>
  <Card.Header>
    <CardTitle>Title</CardTitle>
  </Card.Header>
  <Card.Content>Content</Card.Content>
</Card>
```

### Render Props Pattern
```typescript
// Used with React Dropzone
function FileUpload() {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop
  })
  
  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? 'Drop here' : 'Click to upload'}
    </div>
  )
}
```

## Styling Architecture

### Design System Foundation
- **Colors**: CSS variables for theming
- **Typography**: Geist Sans/Mono font family
- **Spacing**: Tailwind's spacing scale
- **Components**: Consistent sizing and variants

### CSS Architecture
```css
/* Global styles - app/globals.css */
:root {
  --primary: 220 14% 10%;
  --secondary: 220 14% 96%;
  /* Theme variables */
}

/* Component styles - Tailwind classes */
.button {
  @apply inline-flex items-center justify-center rounded-md;
}
```

### Responsive Design
- **Mobile First**: Design for mobile, enhance for desktop
- **Breakpoints**: Tailwind's responsive breakpoints (sm, md, lg, xl)
- **Grid System**: CSS Grid and Flexbox for layouts

## Testing Strategy

### Component Testing
```typescript
// Example test structure
describe('ImageUpload', () => {
  it('should handle file uploads', () => {
    // Test drag and drop
    // Test file validation
    // Test upload success/error states
  })
  
  it('should compress large images', () => {
    // Test compression logic
    // Verify file size reduction
  })
})
```

### Integration Testing
- API route testing with mock Supabase
- End-to-end user flows with Playwright
- Visual regression testing

## Performance Optimizations

### Code Splitting
- Dynamic imports for heavy components
- Route-based splitting with Next.js App Router
- Lazy loading for images and media

### Bundle Optimization
- Tree shaking for unused Radix components
- Selective imports from utility libraries
- SVG optimization with SVGR

### Runtime Performance
- Image compression and optimization
- Debounced user input handling
- Virtualization for large lists (future)

## Accessibility Standards

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML and ARIA labels
- **Color Contrast**: 4.5:1 minimum contrast ratio
- **Focus Management**: Visible focus indicators

### Implementation Details
- Radix UI primitives provide base accessibility
- Custom components follow ARIA patterns
- Form validation includes screen reader support
- Error messages are programmatically associated

## Future Enhancements

### Planned Improvements
- **Component Storybook**: Visual component documentation
- **Design Tokens**: Standardized design system
- **Animation Library**: Framer Motion integration
- **Progressive Web App**: Offline capabilities

### Scalability Considerations
- Component composition over inheritance
- Standardized prop interfaces
- Automated component generation
- Design system documentation