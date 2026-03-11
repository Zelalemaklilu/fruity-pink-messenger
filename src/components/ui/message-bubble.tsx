import { cn } from "@/lib/utils";
import { Check, CheckCheck, Trash2, Download, FileIcon, Image as ImageIcon, Bookmark, BookmarkCheck, Reply, Copy, Forward, Pin, Pencil, ChevronDown, Languages, Loader2 } from "lucide-react";
import { extractUrls } from "@/lib/linkPreviewService";
import { LinkPreviewCard } from "@/components/chat/LinkPreviewCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { saveMessage, unsaveMessage, isMessageSaved } from "@/lib/savedMessagesService";
import { toast } from "sonner";
import { MessageReactions } from "@/components/chat/MessageReactions";
import { addReaction } from "@/lib/reactionService";
import { translateMessage, getTranslation, LANGUAGES, getPreferredLanguage, setPreferredLanguage } from "@/lib/translationService";
import LocationCard from "@/components/chat/LocationCard";

const QUICK_REACTIONS = ["🙏", "👍", "❤️", "👎", "🔥", "🥰", "👏"];

interface MessageBubbleProps {
  message: string;
  timestamp: string;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
  type?: "text" | "image" | "video" | "file" | "voice";
  mediaUrl?: string;
  fileName?: string;
  onDelete?: () => void;
  onDeleteForEveryone?: () => void;
  onReply?: () => void;
  onEdit?: () => void;
  onForward?: () => void;
  onPin?: () => void;
  className?: string;
  messageId?: string;
  chatId?: string;
  isPinned?: boolean;
  bubbleColor?: string;
  fontSize?: "small" | "medium" | "large";
  isViewOnce?: boolean;
}

export function MessageBubble({
  message,
  timestamp,
  isOwn,
  status,
  type = "text",
  mediaUrl,
  fileName,
  onDelete,
  onDeleteForEveryone,
  onReply,
  onEdit,
  onForward,
  onPin,
  className,
  messageId,
  chatId,
  isPinned,
  bubbleColor,
  fontSize = "medium",
  isViewOnce,
}: MessageBubbleProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'unsaving'>('idle');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageId) {
      isMessageSaved(messageId).then(setIsSaved);
      const cached = getTranslation(messageId);
      if (cached) setTranslatedText(cached);
    }
  }, [messageId]);

  useEffect(() => {
    if (!showContextMenu) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showContextMenu]);

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.();
  };

  const handleSave = async () => {
    if (!messageId || !chatId) return;
    setSavingState('saving');
    const success = await saveMessage(messageId, chatId);
    setSavingState('idle');
    if (success) {
      setIsSaved(true);
      toast.success('Message saved');
    } else {
      toast.error('Failed to save message');
    }
  };

  const handleUnsave = async () => {
    if (!messageId) return;
    setSavingState('unsaving');
    const success = await unsaveMessage(messageId);
    setSavingState('idle');
    if (success) {
      setIsSaved(false);
      toast.success('Message unsaved');
    } else {
      toast.error('Failed to unsave message');
    }
  };

  const handleQuickReaction = async (emoji: string) => {
    if (!messageId) return;
    setShowContextMenu(false);
    await addReaction(messageId, emoji);
  };

  const handleCopy = useCallback(() => {
    setShowContextMenu(false);
    if (type === "text" && message) {
      try {
        navigator.clipboard.writeText(message).then(() => {
          toast.success("Copied to clipboard");
        }).catch(() => {
          toast.error("Failed to copy");
        });
      } catch {
        toast.error("Copy not supported");
      }
    }
  }, [message, type]);

  const handleTranslate = useCallback(async (langCode: string) => {
    if (!messageId || !message) return;
    setShowContextMenu(false);
    setShowLangPicker(false);
    setIsTranslating(true);
    try {
      const result = await translateMessage(messageId, message, langCode);
      setTranslatedText(result);
      setPreferredLanguage(langCode);
    } catch {
      toast.error("Translation failed");
    } finally {
      setIsTranslating(false);
    }
  }, [messageId, message]);

  const handleLongPressStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    longPressTimer.current = setTimeout(() => {
      setShowContextMenu(true);
    }, 400);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const menuAction = (fn?: () => void) => {
    setShowContextMenu(false);
    fn?.();
  };

  const renderContent = () => {
    switch (type) {
      case "image":
        return (
          <div className="relative">
            {!imageLoaded && (
              <div className="w-48 h-32 bg-muted animate-pulse rounded-lg flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <img
              src={mediaUrl}
              alt="Shared image"
              className={cn(
                "max-w-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity",
                !imageLoaded && "hidden"
              )}
              onLoad={() => setImageLoaded(true)}
              onClick={() => !showContextMenu && mediaUrl && window.open(mediaUrl, '_blank')}
            />
          </div>
        );
      case "file":
        return (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors"
          >
            <FileIcon className="h-8 w-8" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName || "File"}</p>
              <p className="text-xs opacity-70">Tap to download</p>
            </div>
            <Download className="h-4 w-4" />
          </a>
        );
      case "voice":
        return (
          <audio controls className="max-w-full">
            <source src={mediaUrl} type="audio/webm" />
            Your browser does not support audio.
          </audio>
        );
      default: {
        const locationMatch = message.match(/\[location:(-?\d+\.?\d*),(-?\d+\.?\d*)\]/);
        if (locationMatch) {
          const lat = parseFloat(locationMatch[1]);
          const lng = parseFloat(locationMatch[2]);
          return <LocationCard latitude={lat} longitude={lng} isOwn={isOwn} />;
        }

        const urls = extractUrls(message);
        const firstUrl = urls.length > 0 ? urls[0] : null;

        const renderTextWithLinks = (text: string) => {
          if (urls.length === 0) return text;
          const parts: (string | JSX.Element)[] = [];
          let lastIndex = 0;
          const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
          let match: RegExpExecArray | null;
          while ((match = urlRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
              parts.push(text.slice(lastIndex, match.index));
            }
            parts.push(
              <a
                key={match.index}
                href={match[0]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-400 underline break-all"
                data-testid={`message-link-${match.index}`}
              >
                {match[0]}
              </a>
            );
            lastIndex = match.index + match[0].length;
          }
          if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
          }
          return parts;
        };

        return (
          <div data-testid="message-text-content">
            <p className="leading-relaxed whitespace-pre-wrap">
              {renderTextWithLinks(message)}
            </p>
            {isTranslating && (
              <div className="flex items-center gap-1.5 mt-1">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Translating...</span>
              </div>
            )}
            {translatedText && !isTranslating && (
              <div className="mt-1.5 pt-1.5 border-t border-border/30" data-testid="message-translation">
                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Languages className="h-3 w-3" />
                  Translation
                </p>
                <p className="leading-relaxed whitespace-pre-wrap opacity-80">{translatedText}</p>
              </div>
            )}
            {firstUrl && <LinkPreviewCard url={firstUrl} />}
          </div>
        );
      }
    }
  };

  const statusLabel = status === "read" ? `read at ${timestamp}` : status === "delivered" ? `delivered at ${timestamp}` : status === "sent" ? `sent at ${timestamp}` : "";

  return (
    <>
      <div className={cn(
        "flex w-full group relative",
        isOwn ? "justify-end" : "justify-start",
        className
      )}>
        <div
          className={cn(
            "max-w-[70%] rounded-2xl px-4 py-2 transition-smooth relative select-none",
            isOwn
              ? "bg-chat-bubble-outgoing text-chat-text-outgoing"
              : "bg-chat-bubble-incoming text-chat-text-incoming",
            fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-lg" : "text-sm"
          )}
          style={bubbleColor ? { backgroundColor: bubbleColor } : undefined}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onTouchCancel={handleLongPressEnd}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowContextMenu(true);
          }}
          data-testid={`message-bubble-${messageId || 'unknown'}`}
        >
          {renderContent()}
          <div className="flex items-center justify-end gap-1 mt-1">
            {isSaved && <Bookmark className="h-3 w-3 text-primary" />}
            {isPinned && <Pin className="h-3 w-3 text-primary" />}
            <span className="text-xs opacity-70">{timestamp}</span>
            {isOwn && status && (
              <div className="flex items-center">
                {status === "sent" && <Check className="h-3 w-3 opacity-70" />}
                {status === "delivered" && <CheckCheck className="h-3 w-3 opacity-70" />}
                {status === "read" && <CheckCheck className="h-3 w-3 text-read-receipt" />}
              </div>
            )}
          </div>
        </div>

        {/* Telegram-style context menu */}
        {showContextMenu && (
            <motion.div
              ref={menuRef}
              key="context-menu"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute z-[100] flex flex-col",
                isOwn ? "right-0" : "left-0",
                "bottom-full mb-2"
              )}
              style={{ minWidth: "200px" }}
            >
              {/* Quick reaction emoji bar */}
              {messageId && (
                <div className="flex items-center gap-1 p-1.5 mb-1 rounded-xl bg-popover border border-border shadow-lg">
                  {QUICK_REACTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileTap={{ scale: 0.8 }}
                      onClick={() => handleQuickReaction(emoji)}
                      className="text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                      data-testid={`reaction-${emoji}`}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                    data-testid="reaction-expand"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.button>
                </div>
              )}

              {/* Status info */}
              {isOwn && statusLabel && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 mb-1 rounded-lg bg-popover border border-border shadow-lg">
                  {status === "read" ? (
                    <CheckCheck className="h-3.5 w-3.5 text-read-receipt" />
                  ) : status === "delivered" ? (
                    <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">{statusLabel}</span>
                </div>
              )}

              {/* Menu items */}
              <div className="rounded-xl bg-popover border border-border shadow-lg overflow-hidden">
                {onReply && (
                  <button
                    onClick={() => menuAction(onReply)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-popover-foreground hover:bg-muted transition-colors"
                    data-testid="context-reply"
                  >
                    <Reply className="h-4 w-4 text-muted-foreground" />
                    Reply
                  </button>
                )}
                {type === "text" && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-popover-foreground hover:bg-muted transition-colors"
                    data-testid="context-copy"
                  >
                    <Copy className="h-4 w-4 text-muted-foreground" />
                    Copy
                  </button>
                )}
                {type === "text" && messageId && !showLangPicker && (
                  <button
                    onClick={() => setShowLangPicker(true)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-popover-foreground hover:bg-muted transition-colors"
                    data-testid="context-translate"
                  >
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    Translate
                  </button>
                )}
                {showLangPicker && (
                  <div className="max-h-[200px] overflow-y-auto border-t border-b border-border">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handleTranslate(lang.code)}
                        className={`flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-muted transition-colors ${
                          getPreferredLanguage() === lang.code ? "text-blue-400 font-medium" : "text-popover-foreground"
                        }`}
                        data-testid={`translate-lang-${lang.code}`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                )}
                {onForward && (
                  <button
                    onClick={() => menuAction(onForward)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-popover-foreground hover:bg-muted transition-colors"
                    data-testid="context-forward"
                  >
                    <Forward className="h-4 w-4 text-muted-foreground" />
                    Forward
                  </button>
                )}
                {onPin && (
                  <button
                    onClick={() => menuAction(onPin)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-popover-foreground hover:bg-muted transition-colors"
                    data-testid="context-pin"
                  >
                    <Pin className="h-4 w-4 text-muted-foreground" />
                    {isPinned ? "Unpin" : "Pin"}
                  </button>
                )}
                {messageId && (
                  <button
                    onClick={() => {
                      setShowContextMenu(false);
                      isSaved ? handleUnsave() : handleSave();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-popover-foreground hover:bg-muted transition-colors"
                    data-testid="context-save"
                    disabled={savingState !== 'idle'}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <Bookmark className="h-4 w-4 text-muted-foreground" />
                    )}
                    {isSaved ? "Unsave" : "Save"}
                  </button>
                )}
                {isOwn && onEdit && type === "text" && (
                  <button
                    onClick={() => menuAction(onEdit)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-popover-foreground hover:bg-muted transition-colors"
                    data-testid="context-edit"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      setShowContextMenu(false);
                      setShowDeleteDialog(true);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors"
                    data-testid="context-delete"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete for Me
                  </button>
                )}
                {onDeleteForEveryone && isOwn && (
                  <button
                    onClick={() => {
                      setShowContextMenu(false);
                      onDeleteForEveryone();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors"
                    data-testid="context-delete-everyone"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete for Everyone
                  </button>
                )}
              </div>
            </motion.div>
          )}
      </div>

      {/* Reactions display */}
      {messageId && (
        <div className={cn("px-2", isOwn ? "flex justify-end" : "flex justify-start")}>
          <MessageReactions messageId={messageId} isOwn={isOwn} />
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this message. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
