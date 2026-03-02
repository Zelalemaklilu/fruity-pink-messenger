import { supabase } from "@/integrations/supabase/client";

export interface Story {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  story_type: "text" | "image" | "video";
  media_type?: "image" | "video";
  background_color: string;
  views_count: number;
  duration?: number;
  created_at: string;
  expires_at: string;
}

export interface StoryViewerInfo {
  viewer_id: string;
  viewed_at: string;
  username?: string;
  name?: string;
  avatar_url?: string | null;
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

export async function uploadStoryMedia(file: File): Promise<{ url: string; type: "image" | "video" }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const isVideo = file.type.startsWith("video/");
  const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
  const filePath = `stories/${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("chat-media")
    .upload(filePath, file, { upsert: true });

  if (error) throw new Error("Upload failed: " + error.message);

  const { data: urlData } = supabase.storage
    .from("chat-media")
    .getPublicUrl(filePath);

  return { url: urlData.publicUrl, type: isVideo ? "video" : "image" };
}

export async function createMediaStory(mediaUrl: string, mediaType: "image" | "video", caption?: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("user_stories")
    .insert({
      user_id: user.id,
      media_url: mediaUrl,
      content: caption || null,
      story_type: mediaType === "video" ? "video" : "image",
    } as any);

  if (error) {
    console.error("Error creating media story:", error);
    return false;
  }
  return true;
}

export async function getStoryViewers(storyId: string): Promise<StoryViewerInfo[]> {
  const { data, error } = await supabase
    .from("story_views")
    .select("viewer_id, viewed_at")
    .eq("story_id", storyId);

  if (error || !data) return [];

  const viewerIds = data.map(v => v.viewer_id);
  if (viewerIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, name, avatar_url")
    .in("id", viewerIds);

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  return data.map(v => {
    const p = profileMap.get(v.viewer_id);
    return {
      viewer_id: v.viewer_id,
      viewed_at: v.viewed_at,
      username: p?.username,
      name: p?.name || p?.username,
      avatar_url: p?.avatar_url,
    };
  });
}
