import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Plus, X, Eye, Trash2, Camera, Type, Send, ChevronUp,
  Pause, Play, Volume2, VolumeX, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  getActiveStories,
  createTextStory,
  createMediaStory,
  viewStory,
  getMyViewedStories,
  getStoryViewers,
  deleteStory,
  uploadStoryMedia,
  type Story,
  type StoryGroup,
  type StoryViewerInfo,
} from "@/lib/storyService";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/supabaseStorage";
import { toast } from "sonner";

const STORY_COLORS = [
  "hsl(338, 85%, 55%)",
  "hsl(260, 80%, 55%)",
  "hsl(210, 90%, 50%)",
  "hsl(145, 65%, 42%)",
  "hsl(30, 90%, 55%)",
  "hsl(0, 75%, 55%)",
  "hsl(180, 70%, 45%)",
  "hsl(290, 70%, 50%)",
];

export function StoriesBar() {
  const { userId } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [myStoryGroup, setMyStoryGroup] = useState<StoryGroup | null>(null);
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

    const allGroups: StoryGroup[] = [];
    let myGroup: StoryGroup | null = null;

    if (grouped.has(userId)) {
      const own = grouped.get(userId)!;
      const p = profiles.get(userId);
      myGroup = {
        user_id: userId,
        username: p?.username || "You",
        name: "Your Story",
        avatar_url: p?.avatar_url || null,
        stories: own,
        hasUnviewed: own.some((s) => !viewed.has(s.id)),
      };
      allGroups.push(myGroup);
    }

    for (const [uid, strs] of grouped) {
      if (uid === userId) continue;
      const p = profiles.get(uid);
      allGroups.push({
        user_id: uid,
        username: p?.username || "user",
        name: p?.name || p?.username || "User",
        avatar_url: p?.avatar_url || null,
        stories: strs,
        hasUnviewed: strs.some((s) => !viewed.has(s.id)),
      });
    }

    setMyStoryGroup(myGroup);
    setStoryGroups(allGroups);
  }, [userId]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const openViewer = (groupIdx: number) => {
    setCurrentGroupIndex(groupIdx);
    setCurrentStoryIndex(0);
    setShowViewer(true);
  };

  const handleAddStory = () => {
    setShowCreator(true);
  };

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-border"
        data-testid="stories-bar"
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleAddStory}
          className="flex flex-col items-center gap-1 min-w-[64px]"
          data-testid="button-add-story"
        >
          <div className="relative">
            {myStoryGroup && myStoryGroup.stories.length > 0 ? (
              <div
                className="p-[2px] rounded-full bg-gradient-to-r from-primary to-primary/60 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = storyGroups.findIndex(g => g.user_id === userId);
                  if (idx >= 0) openViewer(idx);
                }}
              >
                <div className="p-[2px] rounded-full bg-background">
                  <ChatAvatar
                    name={myStoryGroup.name}
                    src={myStoryGroup.avatar_url || undefined}
                    size="sm"
                  />
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary/50">
                <Plus className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Plus className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">My Story</span>
        </motion.button>

        {storyGroups
          .filter((g) => g.user_id !== userId)
          .map((group) => {
            const realIdx = storyGroups.findIndex(g => g.user_id === group.user_id);
            return (
              <StoryCircle
                key={group.user_id}
                group={group}
                onClick={() => openViewer(realIdx)}
              />
            );
          })}
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
        {showViewer && storyGroups[currentGroupIndex] && (
          <StoryViewerComponent
            groups={storyGroups}
            initialGroupIndex={currentGroupIndex}
            initialStoryIndex={currentStoryIndex}
            viewedIds={viewedIds}
            userId={userId || ""}
            onClose={() => {
              setShowViewer(false);
              loadStories();
            }}
            onMarkViewed={(id) => {
              setViewedIds((prev) => new Set(prev).add(id));
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function StoryCircle({ group, onClick }: { group: StoryGroup; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1 min-w-[64px]"
      data-testid={`story-circle-${group.user_id}`}
    >
      <div
        className={`p-[2px] rounded-full ${
          group.hasUnviewed
            ? "bg-gradient-to-tr from-primary via-pink-500 to-orange-400"
            : "bg-muted-foreground/30"
        }`}
      >
        <div className="p-[2px] rounded-full bg-background">
          <ChatAvatar
            name={group.name}
            src={group.avatar_url || undefined}
            size="sm"
          />
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">
        {group.name.split(" ")[0]}
      </span>
    </motion.button>
  );
}

function StoryCreator({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [mode, setMode] = useState<"text" | "media">("text");
  const [text, setText] = useState("");
  const [selectedColor, setSelectedColor] = useState(STORY_COLORS[0]);
  const [posting, setPosting] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Max 50MB.");
      return;
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const videoExts = ["mp4", "webm", "mov", "avi", "mkv", "3gp"];
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp"];
    const isVideoByType = file.type.startsWith("video/");
    const isImageByType = file.type.startsWith("image/");
    const isVideoByExt = videoExts.includes(ext);
    const isImageByExt = imageExts.includes(ext);

    const detectedVideo = isVideoByType || isVideoByExt;
    const detectedImage = isImageByType || isImageByExt;

    if (!detectedVideo && !detectedImage) {
      toast.error("Please select an image or video");
      return;
    }

    setIsVideo(detectedVideo);
    setMediaFile(file);

    if (detectedVideo) {
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    } else {
      const reader = new FileReader();
      reader.onload = () => setMediaPreview(reader.result as string);
      reader.onerror = () => {
        const url = URL.createObjectURL(file);
        setMediaPreview(url);
      };
      reader.readAsDataURL(file);
    }
    setMode("media");
  };

  const handlePost = async () => {
    setPosting(true);
    try {
      if (mode === "text") {
        if (!text.trim()) return;
        const success = await createTextStory(text.trim(), selectedColor);
        if (success) {
          toast.success("Story posted!");
          onCreated();
        } else {
          toast.error("Failed to post story");
        }
      } else if (mediaFile) {
        let fileToUpload = mediaFile;
        if (!isVideo && mediaFile.type.startsWith("image/")) {
          try {
            fileToUpload = await compressImage(mediaFile);
          } catch (compErr) {
            console.warn("[StoryCreator] Compression failed, using original:", compErr);
            fileToUpload = mediaFile;
          }
        }

        const { url, type } = await uploadStoryMedia(fileToUpload);
        const success = await createMediaStory(url, type, caption || undefined);

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

  const canPost = mode === "text" ? text.trim().length > 0 : !!mediaFile;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.mp4,.mov,.webm,.3gp"
        className="hidden"
        onChange={handleMediaSelect}
        data-testid="input-story-file"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleMediaSelect}
        data-testid="input-story-camera"
      />

      <div className="flex items-center justify-between p-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-creator">
          <X className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant={mode === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => { setMode("text"); setMediaPreview(null); setMediaFile(null); }}
            data-testid="button-mode-text"
          >
            <Type className="h-4 w-4 mr-1" />
            Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-mode-gallery"
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            Gallery
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            data-testid="button-mode-camera"
          >
            <Camera className="h-4 w-4 mr-1" />
            Camera
          </Button>
        </div>
        <Button
          onClick={handlePost}
          disabled={!canPost || posting}
          size="sm"
          data-testid="button-post-story"
        >
          {posting ? "..." : "Post"}
        </Button>
      </div>

      {mode === "text" ? (
        <div className="flex-1 flex flex-col">
          <div
            className="flex-1 flex items-center justify-center p-8 m-4 rounded-2xl transition-colors relative"
            style={{ backgroundColor: selectedColor }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your story..."
              className="text-center text-2xl font-bold bg-transparent border-none text-white placeholder:text-white/50 focus:outline-none resize-none w-full h-full flex items-center"
              maxLength={500}
              autoFocus
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                lineHeight: "1.4",
              }}
              data-testid="input-story-text"
            />
          </div>

          <div className="flex items-center justify-center gap-2 px-4 pb-4">
            {STORY_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-7 h-7 rounded-full transition-all ${
                  selectedColor === color
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                    : "opacity-70"
                }`}
                style={{ backgroundColor: color }}
                data-testid={`button-color-${color}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {mediaPreview ? (
            <div className="flex-1 flex items-center justify-center bg-black m-4 rounded-2xl overflow-hidden relative">
              {isVideo ? (
                <video
                  src={mediaPreview}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  data-testid="video-story-preview"
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                  data-testid="img-story-preview"
                />
              )}
            </div>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center m-4 rounded-2xl bg-muted cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-select-media"
            >
              <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Tap to select a photo or video</p>
            </div>
          )}
          <div className="px-4 pb-4">
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="bg-muted border-0 rounded-full"
              maxLength={200}
              data-testid="input-story-caption"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StoryViewerComponent({
  groups,
  initialGroupIndex,
  initialStoryIndex,
  viewedIds,
  userId,
  onClose,
  onMarkViewed,
}: {
  groups: StoryGroup[];
  initialGroupIndex: number;
  initialStoryIndex: number;
  viewedIds: Set<string>;
  userId: string;
  onClose: () => void;
  onMarkViewed: (id: string) => void;
}) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<StoryViewerInfo[]>([]);
  const [replyText, setReplyText] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const isOwn = group?.user_id === userId;
  const isVideoStory = story?.story_type === "video" || story?.media_type === "video";

  useEffect(() => {
    if (story && !viewedIds.has(story.id)) {
      viewStory(story.id);
      onMarkViewed(story.id);
    }
  }, [story?.id]);

  const goNext = useCallback(() => {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
    setProgress(0);
    progressRef.current = 0;
    setShowViewers(false);
  }, [group, storyIndex, groupIndex, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((i) => i - 1);
      const prevGroup = groups[groupIndex - 1];
      setStoryIndex(prevGroup.stories.length - 1);
    }
    setProgress(0);
    progressRef.current = 0;
    setShowViewers(false);
  }, [storyIndex, groupIndex, groups]);

  useEffect(() => {
    if (!story || isPaused || showViewers) return;

    const durationMs = (story.duration || 5) * 1000;

    if (isVideoStory && videoRef.current) {
      videoRef.current.play().catch(() => {});
      const updateProgress = () => {
        const v = videoRef.current;
        if (!v || isPaused) return;
        if (v.duration && v.currentTime) {
          const pct = (v.currentTime / v.duration) * 100;
          setProgress(pct);
          progressRef.current = pct;
          if (v.currentTime >= v.duration - 0.1) {
            goNext();
            return;
          }
        }
        animFrameRef.current = requestAnimationFrame(updateProgress);
      };
      animFrameRef.current = requestAnimationFrame(updateProgress);
      return () => cancelAnimationFrame(animFrameRef.current);
    }

    startTimeRef.current = Date.now() - (progressRef.current / 100) * durationMs;

    const tick = () => {
      if (isPaused) return;
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / durationMs) * 100, 100);
      setProgress(pct);
      progressRef.current = pct;
      if (pct >= 100) {
        goNext();
        return;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [story?.id, isPaused, showViewers, isVideoStory, goNext]);

  useEffect(() => {
    setProgress(0);
    progressRef.current = 0;
    startTimeRef.current = Date.now();
    pausedAtRef.current = 0;
  }, [story?.id]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    pausedAtRef.current = Date.now();
    if (isVideoStory && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isVideoStory]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    if (pausedAtRef.current && startTimeRef.current) {
      const pauseDuration = Date.now() - pausedAtRef.current;
      startTimeRef.current += pauseDuration;
    }
    if (isVideoStory && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isVideoStory]);

  const handlePointerDown = (side: "left" | "right") => {
    isLongPressRef.current = false;
    longPressRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      handlePause();
    }, 200);
  };

  const handlePointerUp = (side: "left" | "right") => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    if (isLongPressRef.current) {
      handleResume();
      isLongPressRef.current = false;
      return;
    }
    if (side === "left") goPrev();
    else goNext();
  };

  const handleSwipeEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100) {
      onClose();
    }
  };

  const loadViewers = async () => {
    if (!story) return;
    const v = await getStoryViewers(story.id);
    setViewers(v);
  };

  const toggleViewers = () => {
    if (!showViewers) {
      handlePause();
      loadViewers();
    } else {
      handleResume();
    }
    setShowViewers(!showViewers);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !group) return;
    try {
      const { data: existingChat } = await supabase
        .from("chats")
        .select("id")
        .or(`and(participant_1.eq.${userId},participant_2.eq.${group.user_id}),and(participant_1.eq.${group.user_id},participant_2.eq.${userId})`)
        .maybeSingle();

      let chatId = existingChat?.id;
      if (!chatId) {
        const { data: newChat } = await supabase
          .from("chats")
          .insert({ participant_1: userId, participant_2: group.user_id })
          .select("id")
          .single();
        chatId = newChat?.id;
      }

      if (chatId) {
        await supabase.from("messages").insert({
          chat_id: chatId,
          sender_id: userId,
          receiver_id: group.user_id,
          content: replyText.trim(),
          message_type: "text",
        });
        toast.success("Reply sent");
      }
    } catch {
      toast.error("Failed to send reply");
    }
    setReplyText("");
    handleResume();
  };

  if (!story || !group) return null;

  const timeAgo = getTimeAgo(story.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.3}
      onDragEnd={handleSwipeEnd}
      className="fixed inset-0 z-50 bg-black flex flex-col select-none"
      data-testid="story-viewer"
    >
      <div className="flex gap-[2px] px-2 pt-2" data-testid="story-progress-bars">
        {group.stories.map((s, i) => (
          <div key={s.id} className="flex-1 h-[2px] rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{
                width:
                  i < storyIndex
                    ? "100%"
                    : i === storyIndex
                    ? `${progress}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-3 py-2 z-10">
        <div className="flex items-center gap-2">
          <ChatAvatar name={group.name} src={group.avatar_url || undefined} size="sm" />
          <div>
            <p className="text-white text-sm font-semibold leading-tight">
              {isOwn ? "Your Story" : group.name}
            </p>
            <p className="text-white/50 text-[11px]">{timeAgo}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isVideoStory && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsMuted(!isMuted);
                if (videoRef.current) videoRef.current.muted = !isMuted;
              }}
              className="text-white"
              data-testid="button-toggle-mute"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (isPaused ? handleResume() : handlePause())}
            className="text-white"
            data-testid="button-toggle-pause"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          {isOwn && (
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await deleteStory(story.id);
                toast.success("Story deleted");
                if (group.stories.length <= 1) {
                  onClose();
                } else {
                  goNext();
                }
              }}
              className="text-white"
              data-testid="button-delete-story"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white"
            data-testid="button-close-viewer"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {story.story_type === "text" ? (
          <div
            className="w-full h-full flex items-center justify-center p-8"
            style={{ backgroundColor: story.background_color }}
          >
            <p className="text-white text-2xl font-bold text-center leading-relaxed max-w-md">
              {story.content}
            </p>
          </div>
        ) : isVideoStory ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              src={story.media_url || ""}
              className="w-full h-full object-contain"
              autoPlay
              muted={isMuted}
              playsInline
              preload="auto"
              data-testid="video-story-playback"
            />
            {story.content && (
              <div className="absolute bottom-20 left-0 right-0 px-4 z-10">
                <p className="text-white text-center bg-black/50 rounded-xl px-4 py-2 backdrop-blur-sm text-sm">
                  {story.content}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black relative">
            <img
              src={story.media_url || ""}
              alt="Story"
              className="w-full h-full object-contain"
              data-testid="img-story-display"
            />
            {story.content && (
              <div className="absolute bottom-20 left-0 right-0 px-4 z-10">
                <p className="text-white text-center bg-black/50 rounded-xl px-4 py-2 backdrop-blur-sm text-sm">
                  {story.content}
                </p>
              </div>
            )}
          </div>
        )}

        <div
          className="absolute left-0 top-0 w-1/3 h-full z-20"
          onPointerDown={() => handlePointerDown("left")}
          onPointerUp={() => handlePointerUp("left")}
          onPointerCancel={() => {
            if (longPressRef.current) clearTimeout(longPressRef.current);
            if (isLongPressRef.current) handleResume();
          }}
        />
        <div
          className="absolute right-0 top-0 w-1/3 h-full z-20"
          onPointerDown={() => handlePointerDown("right")}
          onPointerUp={() => handlePointerUp("right")}
          onPointerCancel={() => {
            if (longPressRef.current) clearTimeout(longPressRef.current);
            if (isLongPressRef.current) handleResume();
          }}
        />
      </div>

      <div className="p-3 z-10">
        {isOwn ? (
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              onClick={toggleViewers}
              className="text-white/70 gap-1"
              data-testid="button-show-viewers"
            >
              <Eye className="h-4 w-4" />
              <span className="text-sm">{story.views_count} views</span>
              <ChevronUp
                className={`h-4 w-4 transition-transform ${showViewers ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply to story..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full"
              onFocus={handlePause}
              onBlur={() => { if (!replyText) handleResume(); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleReply(); }}
              data-testid="input-story-reply"
            />
            {replyText.trim() && (
              <Button
                size="icon"
                onClick={handleReply}
                className="rounded-full"
                data-testid="button-send-reply"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showViewers && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl z-30 max-h-[60%] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">
                Viewers ({viewers.length})
              </h3>
              <Button variant="ghost" size="icon" onClick={toggleViewers} data-testid="button-close-viewers">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {viewers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No viewers yet
                </p>
              ) : (
                viewers.map((v) => (
                  <div
                    key={v.viewer_id}
                    className="flex items-center gap-3 p-2 rounded-lg"
                    data-testid={`viewer-${v.viewer_id}`}
                  >
                    <ChatAvatar
                      name={v.name}
                      src={v.avatar_url || undefined}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.name}</p>
                      <p className="text-xs text-muted-foreground">@{v.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
