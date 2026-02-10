import { supabase } from "@/integrations/supabase/client";

export interface Story {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  story_type: "text" | "image";
  background_color: string;
  views_count: number;
  created_at: string;
  expires_at: string;
}

export interface StoryGroup {
  user_id: string;
  username: string;
  name: string;
  avatar_url: string | null;
  stories: Story[];
  hasUnviewed: boolean;
}

export async function getActiveStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from("user_stories")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching stories:", error);
    return [];
  }
  return (data || []) as Story[];
}

export async function createTextStory(content: string, bgColor: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("user_stories")
    .insert({
      user_id: user.id,
      content,
      story_type: "text",
      background_color: bgColor,
    });

  if (error) {
    console.error("Error creating story:", error);
    return false;
  }
  return true;
}

export async function createImageStory(mediaUrl: string, caption?: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("user_stories")
    .insert({
      user_id: user.id,
      media_url: mediaUrl,
      content: caption || null,
      story_type: "image",
    });

  if (error) {
    console.error("Error creating image story:", error);
    return false;
  }
  return true;
}

export async function viewStory(storyId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("story_views")
    .upsert({ story_id: storyId, viewer_id: user.id }, { onConflict: "story_id,viewer_id" });
}

export async function getMyViewedStories(): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("story_views")
    .select("story_id")
    .eq("viewer_id", user.id);

  return new Set((data || []).map((v) => v.story_id));
}

export async function deleteStory(storyId: string): Promise<boolean> {
  const { error } = await supabase
    .from("user_stories")
    .delete()
    .eq("id", storyId);

  if (error) {
    console.error("Error deleting story:", error);
    return false;
  }
  return true;
}
