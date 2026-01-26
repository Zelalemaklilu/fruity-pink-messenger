/**
 * Saved Messages Service
 * Handles saving/unsaving messages and fetching saved messages
 */

import { supabase } from '@/integrations/supabase/client';

export interface SavedMessage {
  id: string;
  user_id: string;
  message_id: string;
  chat_id: string;
  saved_at: string;
  note: string | null;
  // Joined data
  message_content?: string | null;
  message_type?: string;
  sender_id?: string;
}

export interface SavedMessageWithDetails {
  id: string;
  user_id: string;
  message_id: string;
  chat_id: string;
  saved_at: string;
  note: string | null;
  message: {
    id: string;
    content: string | null;
    message_type: string;
    media_url: string | null;
    file_name: string | null;
    sender_id: string;
    created_at: string;
  } | null;
}

/**
 * Save a message
 */
export async function saveMessage(
  messageId: string,
  chatId: string,
  note?: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('saved_messages')
    .insert({
      user_id: user.id,
      message_id: messageId,
      chat_id: chatId,
      note: note || null,
    });

  if (error) {
    console.error('[SavedMessages] Error saving message:', error);
    return false;
  }

  return true;
}

/**
 * Unsave a message
 */
export async function unsaveMessage(messageId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('saved_messages')
    .delete()
    .eq('user_id', user.id)
    .eq('message_id', messageId);

  if (error) {
    console.error('[SavedMessages] Error unsaving message:', error);
    return false;
  }

  return true;
}

/**
 * Check if a message is saved
 */
export async function isMessageSaved(messageId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('saved_messages')
    .select('id')
    .eq('user_id', user.id)
    .eq('message_id', messageId)
    .maybeSingle();

  if (error) {
    console.error('[SavedMessages] Error checking saved status:', error);
    return false;
  }

  return !!data;
}

/**
 * Get all saved messages for current user
 */
export async function getSavedMessages(): Promise<SavedMessageWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // First get saved messages
  const { data: savedMessages, error: savedError } = await supabase
    .from('saved_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  if (savedError) {
    console.error('[SavedMessages] Error fetching saved messages:', savedError);
    return [];
  }

  if (!savedMessages || savedMessages.length === 0) return [];

  // Then get the actual message content
  const messageIds = savedMessages.map(sm => sm.message_id);
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('id, content, message_type, media_url, file_name, sender_id, created_at')
    .in('id', messageIds);

  if (msgError) {
    console.error('[SavedMessages] Error fetching message details:', msgError);
  }

  // Combine the data
  const messagesMap = new Map(messages?.map(m => [m.id, m]) || []);

  return savedMessages.map(sm => ({
    ...sm,
    message: messagesMap.get(sm.message_id) || null,
  }));
}

/**
 * Search saved messages
 */
export async function searchSavedMessages(query: string): Promise<SavedMessageWithDetails[]> {
  const allSaved = await getSavedMessages();
  
  if (!query.trim()) return allSaved;

  const lowerQuery = query.toLowerCase();
  return allSaved.filter(sm => 
    sm.message?.content?.toLowerCase().includes(lowerQuery) ||
    sm.note?.toLowerCase().includes(lowerQuery)
  );
}
