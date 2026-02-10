import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  getActiveStories,
  createTextStory,
  viewStory,
  getMyViewedStories,
  deleteStory,
  type Story,
  type StoryGroup,
} from "@/lib/storyService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORY_COLORS = [
  "hsl(338, 85%, 55%)", // pink
  "hsl(260, 80%, 55%)", // purple
  "hsl(210, 90%, 50%)", // blue
  "hsl(145, 65%, 42%)", // green
  "hsl(30, 90%, 55%)",  // orange
  "hsl(0, 75%, 55%)",   // red
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

    // Group by user
    const grouped = new Map<string, Story[]>();
    for (const s of stories) {
      const arr = grouped.get(s.user_id) || [];
      arr.push(s);
      grouped.set(s.user_id, arr);
    }

    // Fetch profiles for story owners
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
    // Put own stories first
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

  // Auto-advance
  useEffect(() => {
    if (!showViewer) return;
    const timer = setTimeout(nextStory, 5000);
    return () => clearTimeout(timer);
  }, [showViewer, nextStory]);

  return (
    <>
      {/* Stories horizontal scroll */}
      <div className="flex items-center space-x-3 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-border">
        {/* Add story button */}
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

        {/* Story circles */}
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

      {/* Story Creator */}
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

      {/* Story Viewer */}
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

// ========== Story Creator ==========
function StoryCreator({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [text, setText] = useState("");
  const [selectedColor, setSelectedColor] = useState(STORY_COLORS[0]);
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);
    const success = await createTextStory(text.trim(), selectedColor);
    setPosting(false);
    if (success) {
      toast.success("Story posted!");
      onCreated();
    } else {
      toast.error("Failed to post story");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold">Create Story</h2>
        <Button onClick={handlePost} disabled={!text.trim() || posting} size="sm">
          {posting ? "Posting..." : "Post"}
        </Button>
      </div>

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
              transition={i === storyIndex ? { duration: 5, ease: "linear" } : { duration: 0 }}
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
            <img
              src={story.media_url || ""}
              alt="Story"
              className="w-full h-full object-contain"
            />
            {story.content && (
              <div className="absolute bottom-8 left-0 right-0 px-4">
                <p className="text-white text-center bg-black/40 rounded-xl px-4 py-2 backdrop-blur-sm">
                  {story.content}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation areas */}
        <button onClick={onPrev} className="absolute left-0 top-0 w-1/3 h-full" />
        <button onClick={onNext} className="absolute right-0 top-0 w-1/3 h-full" />
      </div>

      {/* Footer */}
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
