import { supabase } from "@/integrations/supabase/client";

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  hasOwn: boolean;
}

export async function getReactions(messageId: string): Promise<Reaction[]> {
  const { data, error } = await supabase
    .from("message_reactions")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching reactions:", error);
    return [];
  }
  return data || [];
}

export async function addReaction(messageId: string, emoji: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("message_reactions")
    .insert({ message_id: messageId, user_id: user.id, emoji });

  if (error) {
    if (error.code === "23505") {
      // Already reacted, remove it (toggle)
      return removeReaction(messageId, emoji);
    }
    console.error("Error adding reaction:", error);
    return false;
  }
  return true;
}

export async function removeReaction(messageId: string, emoji: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji);

  if (error) {
    console.error("Error removing reaction:", error);
    return false;
  }
  return true;
}

export function groupReactions(reactions: Reaction[], currentUserId: string): ReactionGroup[] {
  const groups = new Map<string, ReactionGroup>();

  for (const r of reactions) {
    const existing = groups.get(r.emoji);
    if (existing) {
      existing.count++;
      existing.users.push(r.user_id);
      if (r.user_id === currentUserId) existing.hasOwn = true;
    } else {
      groups.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        users: [r.user_id],
        hasOwn: r.user_id === currentUserId,
      });
    }
  }

  return Array.from(groups.values());
}
