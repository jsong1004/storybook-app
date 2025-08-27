# StoryBook Creator

Transform your photos into magical children's storybooks with AI-powered story generation and custom illustrations.

![StoryBook Creator](./public/placeholder-logo.png)

## 🌟 Features

- **Photo-to-Story AI**: Upload photos and watch as AI generates engaging stories tailored to your images
- **Custom Illustrations**: AI-generated illustrations using Leonardo AI that match your story
- **Age-Appropriate Content**: Stories customized for different age groups (toddlers to young readers)  
- **Theme Selection**: Choose from friendship, adventure, family, nature, magic, and more
- **PDF Export**: Download your completed storybooks as PDFs
- **Secure Sharing**: Share your stories with family and friends via secure links
- **User Authentication**: Secure user accounts with Supabase authentication

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- pnpm (recommended) or npm
- Supabase project
- OpenRouter API key (for story generation)
- Leonardo AI API key (for image generation)
- Vercel Blob storage token (for file uploads)

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Service API Keys
OPENROUTER_API_KEY=your_openrouter_api_key
LEONARDO_API_KEY=your_leonardo_api_key

# File Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Optional
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd storybook-app
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up the database:**
   - Create a new Supabase project
   - Run the SQL scripts in the `scripts/` folder to set up tables
   - Configure your environment variables

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🏗️ Tech Stack

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Runtime**: React 19 with Server Components
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives with shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Vercel Blob

### AI Services
- **Story Generation**: OpenRouter API (Google Gemini 2.5 Flash Lite)
- **Image Generation**: Leonardo AI (Flux Precision model)

### Deployment
- **Platform**: Google Cloud Run
- **Containerization**: Docker
- **CI/CD**: Google Cloud Build

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

## 🏗️ Project Structure

```
storybook-app/
├── app/                     # Next.js App Router
│   ├── api/                # API routes
│   │   ├── upload/         # File upload endpoint
│   │   ├── generate-story/ # Story generation endpoint
│   │   ├── generate-images/# Image generation endpoint
│   │   ├── download-pdf/   # PDF export endpoint
│   │   └── delete-story/   # Story deletion endpoint
│   ├── auth/              # Authentication pages
│   ├── create/            # Story creation page
│   ├── dashboard/         # User dashboard
│   ├── stories/           # Stories listing page
│   ├── story/[id]/        # Individual story view
│   └── share/[id]/        # Public story sharing
├── components/             # React components
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   └── [feature-components] # Custom feature components
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase client configuration
│   └── utils.ts           # Utility functions
├── scripts/               # Database setup scripts
├── docs/                  # Documentation
└── public/                # Static assets
```

## 📖 How It Works

1. **Photo Upload**: Users upload photos through a drag-and-drop interface
2. **Story Customization**: Select age group, theme, length, and tone preferences
3. **AI Analysis**: OpenRouter's Gemini model analyzes photos and generates stories
4. **Image Generation**: Leonardo AI creates custom illustrations for each story page
5. **Story Assembly**: The system combines generated content into a cohesive storybook
6. **Export & Share**: Users can download PDFs or share via secure links

## 🎨 Story Customization Options

### Age Groups
- Toddlers (2-4 years)
- Preschool (4-6 years) 
- Early Readers (6-8 years)
- Young Readers (8-12 years)
- All Ages

### Themes
- Friendship
- Adventure
- Family
- Nature
- Magic
- Learning
- Kindness
- Courage

### Story Length
- Short (2-3 pages)
- Medium (4-5 pages)
- Long (6+ pages)

### Tone
- Playful
- Gentle
- Exciting
- Educational

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **User Authentication**: Secure login/signup with Supabase
- **Content Moderation**: Automatic filtering for child-appropriate content
- **Private Stories**: Users can only access their own stories
- **Secure File Upload**: Validated file types and size limits

## 📊 Database Schema

The application uses four main tables:

- **profiles**: User profile information
- **stories**: Generated stories with metadata
- **story_images**: AI-generated illustrations
- **uploaded_images**: User-uploaded photos

See the complete schema in `scripts/001_create_tables.sql`.

## 📱 API Endpoints

### Authentication Required
- `POST /api/upload` - Upload photos
- `POST /api/generate-story` - Generate story from photos
- `POST /api/generate-images` - Generate illustrations
- `GET /api/download-pdf` - Download story as PDF
- `DELETE /api/delete-story` - Delete story

### Public
- `GET /api/share/[id]` - View shared story (if public)

## 🚀 Deployment

### Docker Deployment

1. **Build the Docker image:**
   ```bash
   docker build -t storybook-app .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=your_url \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
     -e OPENROUTER_API_KEY=your_key \
     -e LEONARDO_API_KEY=your_key \
     -e BLOB_READ_WRITE_TOKEN=your_token \
     storybook-app
   ```

### Google Cloud Run Deployment

The project includes a complete Google Cloud Build configuration (`cloudbuild.yaml`) for automated deployment to Cloud Run.

1. **Set up Google Cloud:**
   - Create a new Google Cloud project
   - Enable Cloud Run and Cloud Build APIs
   - Configure secrets in Secret Manager

2. **Deploy:**
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

## 🛠️ Development Commands

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Docker
docker build -t storybook-app .
docker run -p 3000:3000 storybook-app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@example.com or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Leonardo AI](https://leonardo.ai/) - AI art generation platform
- [OpenRouter](https://openrouter.ai/) - AI model routing platform
- [Vercel](https://vercel.com/) - Blob storage and deployment platform
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

**Made with ❤️ by Startup Consulting Inc.**