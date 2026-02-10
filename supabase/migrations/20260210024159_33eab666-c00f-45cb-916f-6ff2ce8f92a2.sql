
-- Status/Stories table
CREATE TABLE public.user_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT,
  media_url TEXT,
  story_type TEXT NOT NULL DEFAULT 'text' CHECK (story_type IN ('text', 'image')),
  background_color TEXT DEFAULT '#ec4899',
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Story views tracking
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Stories policies: anyone authenticated can view non-expired stories
CREATE POLICY "Users can view non-expired stories"
ON public.user_stories FOR SELECT
USING (expires_at > now());

CREATE POLICY "Users can create their own stories"
ON public.user_stories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
ON public.user_stories FOR DELETE
USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Story owners can view who saw their story"
ON public.story_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_stories s
    WHERE s.id = story_views.story_id AND s.user_id = auth.uid()
  )
  OR viewer_id = auth.uid()
);

CREATE POLICY "Users can mark stories as viewed"
ON public.story_views FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Indexes
CREATE INDEX idx_user_stories_user_id ON public.user_stories(user_id);
CREATE INDEX idx_user_stories_expires_at ON public.user_stories(expires_at);
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stories;
