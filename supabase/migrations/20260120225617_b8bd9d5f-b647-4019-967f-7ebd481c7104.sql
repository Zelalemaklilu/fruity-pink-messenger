-- Add DELETE policy for messages - users can delete their own sent messages
CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);