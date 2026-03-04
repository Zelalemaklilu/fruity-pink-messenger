
-- Add a PERMISSIVE policy so authenticated users can view other users' basic profiles
-- This is needed for call history, stories, contacts etc.
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
