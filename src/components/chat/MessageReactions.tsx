import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getReactions, addReaction, groupReactions, type ReactionGroup } from "@/lib/reactionService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"];

interface MessageReactionsProps {
  messageId: string;
  isOwn: boolean;
}

export function MessageReactions({ messageId, isOwn }: MessageReactionsProps) {
  const { userId } = useAuth();
  const [reactions, setReactions] = useState<ReactionGroup[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!messageId || !userId) return;

    getReactions(messageId).then((data) => {
      setReactions(groupReactions(data, userId));
    });

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions", filter: `message_id=eq.${messageId}` },
        () => {
          getReactions(messageId).then((data) => {
            setReactions(groupReactions(data, userId));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId, userId]);

  const handleReact = async (emoji: string) => {
    setShowPicker(false);
    await addReaction(messageId, emoji);
  };

  return (
    <div className={cn("relative", isOwn ? "flex justify-end" : "flex justify-start")}>
      {/* Existing reactions */}
      {reactions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {reactions.map((group) => (
            <motion.button
              key={group.emoji}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => handleReact(group.emoji)}
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                group.hasOwn
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <span>{group.emoji}</span>
              <span className="font-medium">{group.count}</span>
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setShowPicker(!showPicker)}
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs border border-border bg-muted/30 text-muted-foreground hover:bg-muted transition-colors"
          >
            +
          </motion.button>
        </div>
      )}

      {/* Emoji picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 5 }}
            className={cn(
              "absolute z-50 bottom-full mb-1 flex gap-1 p-2 rounded-xl bg-popover border border-border shadow-lg",
              isOwn ? "right-0" : "left-0"
            )}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => handleReact(emoji)}
                className="text-lg hover:bg-muted rounded-lg w-8 h-8 flex items-center justify-center transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add reaction trigger (when no reactions yet) */}
      {reactions.length === 0 && (
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => setShowPicker(!showPicker)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground mt-0.5"
        >
          😀
        </motion.button>
      )}
    </div>
  );
}
