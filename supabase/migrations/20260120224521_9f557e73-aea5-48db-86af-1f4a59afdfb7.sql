-- 1. Fix find_or_create_chat to verify caller is a participant
CREATE OR REPLACE FUNCTION public.find_or_create_chat(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_chat_id UUID;
  new_chat_id UUID;
  p1 UUID;
  p2 UUID;
BEGIN
  -- SECURITY CHECK: Ensure caller is one of the participants
  IF auth.uid() != user1_id AND auth.uid() != user2_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only create chats you participate in';
  END IF;

  -- Normalize participant order to prevent duplicates
  IF user1_id < user2_id THEN
    p1 := user1_id;
    p2 := user2_id;
  ELSE
    p1 := user2_id;
    p2 := user1_id;
  END IF;

  -- Check for existing chat
  SELECT id INTO existing_chat_id
  FROM public.chats
  WHERE (participant_1 = p1 AND participant_2 = p2)
     OR (participant_1 = p2 AND participant_2 = p1);

  IF existing_chat_id IS NOT NULL THEN
    RETURN existing_chat_id;
  END IF;

  -- Create new chat
  INSERT INTO public.chats (participant_1, participant_2)
  VALUES (p1, p2)
  RETURNING id INTO new_chat_id;

  RETURN new_chat_id;
END;
$$;

-- 2. Create a view for public profile data (excludes sensitive fields)
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  username,
  name,
  avatar_url,
  bio,
  is_online,
  last_seen,
  is_active,
  created_at
FROM public.profiles;

-- 3. Update profiles RLS - restrict full access to own profile only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can only see their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 4. Grant access to the public view for chat participants
CREATE POLICY "Users can view chat participants via view"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE (chats.participant_1 = auth.uid() AND chats.participant_2 = profiles.id)
       OR (chats.participant_2 = auth.uid() AND chats.participant_1 = profiles.id)
  )
);

-- 5. Add database constraints for input validation
ALTER TABLE public.profiles
  ADD CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]+$'),
  ADD CONSTRAINT name_length CHECK (name IS NULL OR char_length(name) <= 100),
  ADD CONSTRAINT bio_length CHECK (bio IS NULL OR char_length(bio) <= 500);

ALTER TABLE public.messages
  ADD CONSTRAINT content_length CHECK (content IS NULL OR char_length(content) <= 10000);

-- 6. Create storage buckets with proper security
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 7. Storage RLS policies for avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 8. Storage RLS policies for chat media
CREATE POLICY "Chat participants can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media' AND
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id::text = (storage.foldername(name))[1]
    AND (chats.participant_1 = auth.uid() OR chats.participant_2 = auth.uid())
  )
);

CREATE POLICY "Chat participants can view media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-media' AND
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id::text = (storage.foldername(name))[1]
    AND (chats.participant_1 = auth.uid() OR chats.participant_2 = auth.uid())
  )
);

CREATE POLICY "Chat participants can delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-media' AND
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id::text = (storage.foldername(name))[1]
    AND (chats.participant_1 = auth.uid() OR chats.participant_2 = auth.uid())
  )
);