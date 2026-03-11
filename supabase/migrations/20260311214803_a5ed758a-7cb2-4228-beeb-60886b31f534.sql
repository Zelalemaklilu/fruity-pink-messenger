-- Etok short-video feature schema sync from external repository
CREATE TABLE IF NOT EXISTS public.etok_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  sound_name TEXT NOT NULL DEFAULT 'Original Sound',
  duration INTEGER NOT NULL DEFAULT 15,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  privacy TEXT NOT NULL DEFAULT 'everyone' CHECK (privacy IN ('everyone', 'friends', 'only_me')),
  allow_comments BOOLEAN NOT NULL DEFAULT true,
  allow_duet BOOLEAN NOT NULL DEFAULT true,
  allow_stitch BOOLEAN NOT NULL DEFAULT true,
  allow_download BOOLEAN NOT NULL DEFAULT true,
  is_sponsored BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.etok_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.etok_videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

CREATE TABLE IF NOT EXISTS public.etok_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.etok_videos(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  parent_id UUID REFERENCES public.etok_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.etok_follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.etok_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etok_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etok_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etok_follows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_videos' AND policyname='Public videos are viewable by everyone'
  ) THEN
    CREATE POLICY "Public videos are viewable by everyone"
    ON public.etok_videos
    FOR SELECT
    USING (privacy = 'everyone' OR auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_videos' AND policyname='Users can insert their own videos'
  ) THEN
    CREATE POLICY "Users can insert their own videos"
    ON public.etok_videos
    FOR INSERT
    WITH CHECK (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_videos' AND policyname='Users can update their own videos'
  ) THEN
    CREATE POLICY "Users can update their own videos"
    ON public.etok_videos
    FOR UPDATE
    USING (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_videos' AND policyname='Users can delete their own videos'
  ) THEN
    CREATE POLICY "Users can delete their own videos"
    ON public.etok_videos
    FOR DELETE
    USING (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_likes' AND policyname='Likes are viewable by everyone'
  ) THEN
    CREATE POLICY "Likes are viewable by everyone"
    ON public.etok_likes
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_likes' AND policyname='Users can insert their own likes'
  ) THEN
    CREATE POLICY "Users can insert their own likes"
    ON public.etok_likes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_likes' AND policyname='Users can delete their own likes'
  ) THEN
    CREATE POLICY "Users can delete their own likes"
    ON public.etok_likes
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_comments' AND policyname='Comments are viewable by everyone'
  ) THEN
    CREATE POLICY "Comments are viewable by everyone"
    ON public.etok_comments
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_comments' AND policyname='Users can insert their own comments'
  ) THEN
    CREATE POLICY "Users can insert their own comments"
    ON public.etok_comments
    FOR INSERT
    WITH CHECK (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_comments' AND policyname='Users can delete their own comments'
  ) THEN
    CREATE POLICY "Users can delete their own comments"
    ON public.etok_comments
    FOR DELETE
    USING (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_follows' AND policyname='Follows are viewable by everyone'
  ) THEN
    CREATE POLICY "Follows are viewable by everyone"
    ON public.etok_follows
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_follows' AND policyname='Users can insert their own follows'
  ) THEN
    CREATE POLICY "Users can insert their own follows"
    ON public.etok_follows
    FOR INSERT
    WITH CHECK (auth.uid() = follower_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='etok_follows' AND policyname='Users can delete their own follows'
  ) THEN
    CREATE POLICY "Users can delete their own follows"
    ON public.etok_follows
    FOR DELETE
    USING (auth.uid() = follower_id);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_etok_videos_created_at ON public.etok_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_etok_videos_author_id ON public.etok_videos(author_id);
CREATE INDEX IF NOT EXISTS idx_etok_likes_video_id ON public.etok_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_etok_comments_video_id ON public.etok_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_etok_follows_following_id ON public.etok_follows(following_id);