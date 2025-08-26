-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create story_images table for generated images
CREATE TABLE IF NOT EXISTS public.story_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT,
  page_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploaded_images table for user uploads
CREATE TABLE IF NOT EXISTS public.uploaded_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  original_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Stories policies
CREATE POLICY "stories_select_own" ON public.stories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stories_insert_own" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stories_update_own" ON public.stories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "stories_delete_own" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Story images policies
CREATE POLICY "story_images_select_own" ON public.story_images 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_images.story_id 
      AND stories.user_id = auth.uid()
    )
  );
CREATE POLICY "story_images_insert_own" ON public.story_images 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_images.story_id 
      AND stories.user_id = auth.uid()
    )
  );
CREATE POLICY "story_images_delete_own" ON public.story_images 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_images.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Uploaded images policies
CREATE POLICY "uploaded_images_select_own" ON public.uploaded_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "uploaded_images_insert_own" ON public.uploaded_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "uploaded_images_delete_own" ON public.uploaded_images FOR DELETE USING (auth.uid() = user_id);
