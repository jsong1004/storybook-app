# StoryBook Creator 📚✨

Transform your photos into magical storybooks with AI. Upload images and watch as our AI creates enchanting stories with beautiful custom illustrations for all ages.

## 🌟 Features

- **AI-Powered Story Generation**: Upload photos and let AI create engaging, family-friendly stories
- **Custom Illustrations**: Automatically generated artwork based on your story content
- **User Authentication**: Secure user accounts with Supabase Auth
- **Image Management**: Upload and manage story images with Vercel Blob storage
- **Responsive Design**: Beautiful UI built with Next.js 15 and Tailwind CSS
- **Database Integration**: Full CRUD operations with Supabase PostgreSQL

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with server components
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### Backend & Services
- **Supabase** - Database, authentication, and real-time features
- **Vercel Blob** - Image storage and management
- **OpenRouter API** - AI story generation (Gemini 2.0 Flash)
- **Leonardo AI** - AI illustration generation

### UI Components
- **shadcn/ui** - Pre-built component library
- **Geist Font** - Modern typography
- **React Hook Form** - Form management with validation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (preferred package manager)
- Supabase project
- OpenRouter API key (optional, fallback stories provided)
- Leonardo AI API key (optional, for custom illustrations)

### Installation

1. **Clone the repository**
   ```bash
   git clone &lt;repository-url&gt;
   cd storybook-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp .env.local.example .env.local
   ```

4. **Configure environment variables**
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Storage
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   
   # AI Services (Optional)
   OPENROUTER_API_KEY=your_openrouter_key
   LEONARDO_API_KEY=your_leonardo_api_key # Optional, for AI illustrations
   ```

5. **Database setup**
   ```bash
   # Run the SQL scripts in your Supabase dashboard
   # 1. scripts/001_create_tables.sql
   # 2. scripts/002_profile_trigger.sql
   ```

6. **Start development server**
   ```bash
   pnpm dev
   ```

Visit `http://localhost:3000` to see the application running.

## 📁 Project Structure

```
storybook-app/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── generate-images/ # AI illustration generation
│   │   ├── generate-story/  # AI story creation
│   │   └── upload/         # Image upload handling
│   ├── auth/              # Authentication pages
│   ├── create/            # Story creation interface
│   ├── dashboard/         # User dashboard
│   ├── stories/           # Stories listing
│   └── story/[id]/        # Individual story view
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── custom/           # Custom components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── supabase/         # Database configuration
│   └── utils.ts          # Helper functions
├── public/               # Static assets
├── scripts/              # Database migration scripts
└── styles/               # Global styles
```

## 🔑 Key Features Walkthrough

### 1. User Authentication
- Secure sign-up/sign-in with Supabase Auth
- Profile management with avatar support
- Protected routes and API endpoints

### 2. Story Creation Flow
1. **Upload Images**: Drag-and-drop up to 5 images
2. **AI Analysis**: OpenRouter API analyzes images for story elements
3. **Story Generation**: AI creates family-friendly narratives
4. **Illustration Creation**: Background generation of custom artwork
5. **Story Viewing**: Rich reading experience with generated content

### 2.1 Illustration Generation Details
- **Provider**: Leonardo AI `generations` API using the Flux Precision (Dev) model
- **Env var**: Set `LEONARDO_API_KEY` in `.env.local` to enable real image generation
- **Page breaks → image mapping**: The story can include explicit page markers. Use:
  - `---PAGE BREAK---` on its own line to split the story into pages
  - The generator creates one illustration prompt per page
  - If no page breaks are found, it falls back to sentence-based sections
- **Style diversity**: Each image uses a different art style and composition (watercolor, colored pencil, gouache, ink-and-wash) and varied aspect ratios (square, landscape, portrait) for visual variety.
- **Consistency hints**: Character and setting cues are auto-extracted from the story to keep visuals coherent across pages.
- **Content moderation**: Potentially sensitive words are softened to child‑friendly alternatives before prompt submission.
- **Fallback**: If the provider fails or is unavailable, a local placeholder image is used so the flow remains functional.

### 3. Database Schema
- `profiles`: User profile information
- `stories`: Generated story content and metadata
- `story_images`: AI-generated illustrations
- `uploaded_images`: User-uploaded source images

## 🔧 API Endpoints

### Story Generation
- `POST /api/generate-story` - Create new story from images
- Analyzes uploaded images and generates narrative content
- Supports fallback stories when AI services unavailable

### Image Management
- `POST /api/upload` - Handle image uploads to Vercel Blob
- `POST /api/generate-images` - Create custom illustrations (Leonardo AI). When the story includes `---PAGE BREAK---`, the API generates one image per page; otherwise it produces a small set of diverse images.

## 🎨 Styling & Design

- **Design System**: Consistent spacing, colors, and typography
- **Dark/Light Mode**: Theme support with next-themes
- **Responsive**: Mobile-first design approach
- **Accessibility**: WCAG compliant components from Radix UI

## 🚀 Deployment

### Vercel (Recommended)
```bash
pnpm build
vercel --prod
```

### Environment Variables for Production
Ensure all environment variables are configured in your deployment platform.

## 🧪 Development

### Code Quality
```bash
pnpm lint      # ESLint checking
pnpm build     # Production build test
```

### Database Migrations
Run SQL scripts in order:
1. `001_create_tables.sql` - Core schema
2. `002_profile_trigger.sql` - User profile automation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is created for educational/portfolio purposes.

## 🆘 Support

For issues or questions:
1. Check the documentation
2. Review environment configuration
3. Verify API key setup
4. Create an issue with detailed information

---

**Happy storytelling!** 📖✨