-- ============================================
-- SAVED MESSAGES TABLE
-- ============================================
CREATE TABLE public.saved_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note TEXT,
  UNIQUE(user_id, message_id)
);

-- Enable RLS
ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own saved messages
CREATE POLICY "Users can view their own saved messages"
  ON public.saved_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save messages"
  ON public.saved_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave messages"
  ON public.saved_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_saved_messages_user ON public.saved_messages(user_id);
CREATE INDEX idx_saved_messages_message ON public.saved_messages(message_id);

-- ============================================
-- GROUPS TABLE
-- ============================================
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  avatar_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GROUP MEMBERS TABLE
-- ============================================
CREATE TYPE public.group_role AS ENUM ('admin', 'member');

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.group_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);

-- ============================================
-- GROUP MESSAGES TABLE
-- ============================================
CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX idx_group_messages_group ON public.group_messages(group_id);
CREATE INDEX idx_group_messages_created ON public.group_messages(created_at DESC);

-- ============================================
-- SECURITY DEFINER FUNCTION: Check group membership
-- ============================================
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

-- ============================================
-- SECURITY DEFINER FUNCTION: Check if user is group admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'admin'
  );
$$;

-- ============================================
-- RLS POLICIES FOR GROUPS
-- ============================================
CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  USING (public.is_group_member(id));

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update group info"
  ON public.groups FOR UPDATE
  USING (public.is_group_admin(id));

CREATE POLICY "Admins can delete groups"
  ON public.groups FOR DELETE
  USING (public.is_group_admin(id));

-- ============================================
-- RLS POLICIES FOR GROUP MEMBERS
-- ============================================
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id));

CREATE POLICY "Admins can add members"
  ON public.group_members FOR INSERT
  WITH CHECK (public.is_group_admin(group_id) OR (
    -- Creator adding themselves as first admin
    auth.uid() = user_id AND role = 'admin'
  ));

CREATE POLICY "Admins can update member roles"
  ON public.group_members FOR UPDATE
  USING (public.is_group_admin(group_id));

CREATE POLICY "Admins can remove members"
  ON public.group_members FOR DELETE
  USING (public.is_group_admin(group_id) OR auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR GROUP MESSAGES
-- ============================================
CREATE POLICY "Members can view group messages"
  ON public.group_messages FOR SELECT
  USING (public.is_group_member(group_id));

CREATE POLICY "Members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (public.is_group_member(group_id) AND auth.uid() = sender_id);

CREATE POLICY "Senders can delete their messages"
  ON public.group_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- ============================================
-- TRIGGER: Update groups.updated_at
-- ============================================
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TRIGGER: Update group_messages.updated_at
-- ============================================
CREATE TRIGGER update_group_messages_updated_at
  BEFORE UPDATE ON public.group_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Enable realtime for group messages
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;