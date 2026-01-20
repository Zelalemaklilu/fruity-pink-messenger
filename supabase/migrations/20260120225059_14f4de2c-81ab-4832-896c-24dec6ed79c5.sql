-- 1. Remove the policy that exposes full profiles to chat participants
DROP POLICY IF EXISTS "Users can view chat participants via view" ON public.profiles;

-- 2. Drop the view that can't have RLS
DROP VIEW IF EXISTS public.profiles_public;

-- 3. Create a security definer function to get public profile data only
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  name text,
  avatar_url text,
  bio text,
  is_online boolean,
  last_seen timestamptz,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.username,
    p.name,
    p.avatar_url,
    p.bio,
    p.is_online,
    p.last_seen,
    p.is_active,
    p.created_at
  FROM public.profiles p
  WHERE p.id = profile_id
    AND (
      -- User is viewing their own profile
      auth.uid() = profile_id
      OR
      -- User is a chat participant with this profile
      EXISTS (
        SELECT 1 FROM public.chats c
        WHERE (c.participant_1 = auth.uid() AND c.participant_2 = profile_id)
           OR (c.participant_2 = auth.uid() AND c.participant_1 = profile_id)
      )
    );
$$;

-- 4. Create function to search users by username (returns only public fields)
CREATE OR REPLACE FUNCTION public.search_users_public(search_term text)
RETURNS TABLE (
  id uuid,
  username text,
  name text,
  avatar_url text,
  bio text,
  is_online boolean,
  last_seen timestamptz,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.username,
    p.name,
    p.avatar_url,
    p.bio,
    p.is_online,
    p.last_seen,
    p.is_active
  FROM public.profiles p
  WHERE p.username ILIKE (search_term || '%')
  LIMIT 20;
$$;