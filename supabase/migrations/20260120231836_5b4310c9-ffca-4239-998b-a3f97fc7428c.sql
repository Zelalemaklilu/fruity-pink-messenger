-- Add unique constraint for typing_indicators upsert to work
ALTER TABLE public.typing_indicators 
ADD CONSTRAINT typing_indicators_chat_user_unique UNIQUE (chat_id, user_id);

-- Create index for faster message status updates
CREATE INDEX IF NOT EXISTS idx_messages_status_receiver 
ON public.messages (chat_id, receiver_id, status);

-- Create index for faster message reads
CREATE INDEX IF NOT EXISTS idx_messages_chat_created 
ON public.messages (chat_id, created_at DESC);