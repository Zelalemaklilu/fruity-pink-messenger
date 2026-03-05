-- Create moderator check function
CREATE OR REPLACE FUNCTION public.is_group_moderator(p_group_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id 
      AND user_id = p_user_id 
      AND role IN ('admin', 'moderator')
  );
$$;

-- Add ban table for group bans
CREATE TABLE IF NOT EXISTS public.group_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  banned_by uuid NOT NULL,
  reason text,
  banned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view bans"
ON public.group_bans FOR SELECT TO authenticated
USING (is_group_moderator(group_id));

CREATE POLICY "Moderators can ban users"
ON public.group_bans FOR INSERT TO authenticated
WITH CHECK (is_group_moderator(group_id) AND banned_by = auth.uid());

CREATE POLICY "Admins can unban users"
ON public.group_bans FOR DELETE TO authenticated
USING (is_group_admin(group_id));

-- Add group events table
CREATE TABLE IF NOT EXISTS public.group_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reminder_sent boolean DEFAULT false
);

ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group events"
ON public.group_events FOR SELECT TO authenticated
USING (is_group_member(group_id));

CREATE POLICY "Moderators can create events"
ON public.group_events FOR INSERT TO authenticated
WITH CHECK (is_group_moderator(group_id) AND created_by = auth.uid());

CREATE POLICY "Moderators can update events"
ON public.group_events FOR UPDATE TO authenticated
USING (is_group_moderator(group_id));

CREATE POLICY "Moderators can delete events"
ON public.group_events FOR DELETE TO authenticated
USING (is_group_moderator(group_id));