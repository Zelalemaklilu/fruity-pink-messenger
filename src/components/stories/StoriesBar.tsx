import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronLeft, ChevronRight, Eye, Trash2, Image as ImageIcon, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  getActiveStories,
  createTextStory,
  createImageStory,
  viewStory,
  getMyViewedStories,
  deleteStory,
  type Story,
  type StoryGroup,
} from "@/lib/storyService";
import { supabase } from "@/integrations/supabase/client";
import { uploadChatImage, compressImage } from "@/lib/supabaseStorage";
import { toast } from "sonner";

const STORY_COLORS = [
  "hsl(338, 85%, 55%)",
  "hsl(260, 80%, 55%)",
  "hsl(210, 90%, 50%)",
  "hsl(145, 65%, 42%)",
  "hsl(30, 90%, 55%)",
  "hsl(0, 75%, 55%)",
];

export function StoriesBar() {
  const { userId } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());

  const loadStories = useCallback(async () => {
    if (!userId) return;
    const [stories, viewed] = await Promise.all([
      getActiveStories(),
      getMyViewedStories(),
    ]);
    setViewedIds(viewed);

    const grouped = new Map<string, Story[]>();
    for (const s of stories) {
      const arr = grouped.get(s.user_id) || [];
      arr.push(s);
      grouped.set(s.user_id, arr);
    }

    const userIds = Array.from(grouped.keys());
    const profiles = new Map<string, { username: string; name: string; avatar_url: string | null }>();
    
    if (userIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, name, avatar_url")
        .in("id", userIds);
      for (const p of data || []) {
        profiles.set(p.id, { username: p.username, name: p.name || p.username, avatar_url: p.avatar_url });
      }
    }

    const groups: StoryGroup[] = [];
    if (grouped.has(userId)) {
      const own = grouped.get(userId)!;
      const p = profiles.get(userId);
      groups.push({
        user_id: userId,
        username: p?.username || "You",
        name: "Your Story",
        avatar_url: p?.avatar_url || null,
        stories: own,
        hasUnviewed: own.some((s) => !viewed.has(s.id)),
      });
    }
    for (const [uid, strs] of grouped) {
      if (uid === userId) continue;
      const p = profiles.get(uid);
      groups.push({
        user_id: uid,
        username: p?.username || "user",
        name: p?.name || p?.username || "User",
        avatar_url: p?.avatar_url || null,
        stories: strs,
        hasUnviewed: strs.some((s) => !viewed.has(s.id)),
      });
    }

    setStoryGroups(groups);
  }, [userId]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const openViewer = (groupIdx: number) => {
    setCurrentGroupIndex(groupIdx);
    setCurrentStoryIndex(0);
    setShowViewer(true);
  };

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  const nextStory = useCallback(async () => {
    if (!currentGroup) return;
    if (currentStory) {
      viewStory(currentStory.id);
      setViewedIds((prev) => new Set(prev).add(currentStory.id));
    }
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex((i) => i + 1);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex((i) => i + 1);
      setCurrentStoryIndex(0);
    } else {
      setShowViewer(false);
    }
  }, [currentGroup, currentStory, currentStoryIndex, currentGroupIndex, storyGroups.length]);

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((i) => i - 1);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex((i) => i - 1);
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    }
  };

  useEffect(() => {
    if (!showViewer) return;
    const duration = currentStory?.story_type === 'image' ? 7000 : 5000;
    const timer = setTimeout(nextStory, duration);
    return () => clearTimeout(timer);
  }, [showViewer, nextStory, currentStory]);

  return (
    <>
      <div className="flex items-center space-x-3 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-border">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreator(true)}
          className="flex flex-col items-center space-y-1 min-w-[60px]"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary/50">
              <Plus className="h-6 w-6 text-primary" />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">Add</span>
        </motion.button>

        {storyGroups.map((group, idx) => (
          <motion.button
            key={group.user_id}
            whileTap={{ scale: 0.9 }}
            onClick={() => openViewer(idx)}
            className="flex flex-col items-center space-y-1 min-w-[60px]"
          >
            <div
              className={`p-0.5 rounded-full ${
                group.hasUnviewed
                  ? "bg-gradient-to-r from-primary to-primary-glow"
                  : "bg-muted-foreground/30"
              }`}
            >
              <div className="p-0.5 rounded-full bg-background">
                <ChatAvatar
                  name={group.name}
                  src={group.avatar_url || undefined}
                  size="sm"
                />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">
              {group.user_id === userId ? "You" : group.name.split(" ")[0]}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showCreator && (
          <StoryCreator
            onClose={() => setShowCreator(false)}
            onCreated={() => {
              setShowCreator(false);
              loadStories();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showViewer && currentStory && currentGroup && (
          <StoryViewer
            story={currentStory}
            group={currentGroup}
            storyIndex={currentStoryIndex}
            totalStories={currentGroup.stories.length}
            isOwn={currentGroup.user_id === userId}
            onNext={nextStory}
            onPrev={prevStory}
            onClose={() => setShowViewer(false)}
            onDelete={async () => {
              await deleteStory(currentStory.id);
              toast.success("Story deleted");
              setShowViewer(false);
              loadStories();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ========== Story Creator with Photo/Video support ==========
function StoryCreator({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [mode, setMode] = useState<'text' | 'media'>('text');
  const [text, setText] = useState("");
  const [selectedColor, setSelectedColor] = useState(STORY_COLORS[0]);
  const [posting, setPosting] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Support images and videos
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error("Please select an image or video");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large. Max 20MB.");
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
    setMode('media');
  };

  const handlePost = async () => {
    setPosting(true);
    try {
      if (mode === 'text') {
        if (!text.trim()) return;
        const success = await createTextStory(text.trim(), selectedColor);
        if (success) {
          toast.success("Story posted!");
          onCreated();
        } else {
          toast.error("Failed to post story");
        }
      } else if (mediaFile) {
        // Upload to storage
        let fileToUpload = mediaFile;
        if (mediaFile.type.startsWith('image/')) {
          fileToUpload = await compressImage(mediaFile);
        }
        
        const fileName = `story-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const ext = mediaFile.name.split('.').pop() || 'jpg';
        const path = `stories/${fileName}.${ext}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(path, fileToUpload);

        if (uploadError) throw uploadError;

        const { data: urlData } = await supabase.storage
          .from('chat-media')
          .createSignedUrl(path, 86400); // 24h URL

        if (!urlData?.signedUrl) throw new Error('Failed to get URL');

        const success = await createImageStory(urlData.signedUrl, caption || undefined);
        if (success) {
          toast.success("Story posted!");
          onCreated();
        } else {
          toast.error("Failed to post story");
        }
      }
    } catch (err) {
      console.error("Story post error:", err);
      toast.error("Failed to post story");
    } finally {
      setPosting(false);
    }
  };

  const canPost = mode === 'text' ? text.trim().length > 0 : !!mediaFile;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleMediaSelect}
      />

      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <Button
            variant={mode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setMode('text'); setMediaPreview(null); setMediaFile(null); }}
          >
            Text
          </Button>
          <Button
            variant={mode === 'media' ? 'default' : 'outline'}
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-4 w-4 mr-1" />
            Photo/Video
          </Button>
        </div>
        <Button onClick={handlePost} disabled={!canPost || posting} size="sm">
          {posting ? "Posting..." : "Post"}
        </Button>
      </div>

      {mode === 'text' ? (
        <>
          <div
            className="flex-1 flex items-center justify-center p-8 mx-4 rounded-2xl transition-colors"
            style={{ backgroundColor: selectedColor }}
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your story..."
              className="text-center text-xl font-bold bg-transparent border-none text-white placeholder:text-white/50 focus-visible:ring-0"
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-center space-x-3 p-4">
            {STORY_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full transition-transform ${
                  selectedColor === color ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110" : ""
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col">
          {mediaPreview ? (
            <div className="flex-1 flex items-center justify-center bg-black mx-4 rounded-2xl overflow-hidden relative">
              {mediaFile?.type.startsWith('video/') ? (
                <video
                  src={mediaPreview}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center mx-4 rounded-2xl bg-muted cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Tap to select a photo or video</p>
            </div>
          )}
          <div className="p-4">
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="bg-muted border-0 rounded-full"
              maxLength={200}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ========== Story Viewer ==========
function StoryViewer({
  story,
  group,
  storyIndex,
  totalStories,
  isOwn,
  onNext,
  onPrev,
  onClose,
  onDelete,
}: {
  story: Story;
  group: StoryGroup;
  storyIndex: number;
  totalStories: number;
  isOwn: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const timeAgo = getTimeAgo(story.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Progress bars */}
      <div className="flex space-x-1 p-2">
        {Array.from({ length: totalStories }).map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: i < storyIndex ? "100%" : "0%" }}
              animate={{ width: i <= storyIndex ? "100%" : "0%" }}
              transition={i === storyIndex ? { duration: story.story_type === 'image' ? 7 : 5, ease: "linear" } : { duration: 0 }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-3">
          <ChatAvatar name={group.name} src={group.avatar_url || undefined} size="sm" />
          <div>
            <p className="text-white text-sm font-semibold">{group.name}</p>
            <p className="text-white/60 text-xs">{timeAgo}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isOwn && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-white hover:bg-white/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative">
        {story.story_type === "text" ? (
          <div
            className="w-full h-full flex items-center justify-center p-8"
            style={{ backgroundColor: story.background_color }}
          >
            <p className="text-white text-2xl font-bold text-center leading-relaxed">
              {story.content}
            </p>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {story.media_url?.includes('.mp4') || story.media_url?.includes('.webm') || story.media_url?.includes('video') ? (
              <video
                src={story.media_url || ""}
                className="w-full h-full object-contain"
                autoPlay
                muted
                playsInline
              />
            ) : (
              <img
                src={story.media_url || ""}
                alt="Story"
                className="w-full h-full object-contain"
              />
            )}
            {story.content && (
              <div className="absolute bottom-8 left-0 right-0 px-4">
                <p className="text-white text-center bg-black/40 rounded-xl px-4 py-2 backdrop-blur-sm">
                  {story.content}
                </p>
              </div>
            )}
          </div>
        )}

        <button onClick={onPrev} className="absolute left-0 top-0 w-1/3 h-full" />
        <button onClick={onNext} className="absolute right-0 top-0 w-1/3 h-full" />
      </div>

      {isOwn && (
        <div className="p-4 flex items-center justify-center">
          <div className="flex items-center space-x-1 text-white/60 text-sm">
            <Eye className="h-4 w-4" />
            <span>{story.views_count} views</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return "1d ago";
}
