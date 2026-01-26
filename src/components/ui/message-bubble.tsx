import { cn } from "@/lib/utils";
import { Check, CheckCheck, Trash2, MoreVertical, Download, FileIcon, Image as ImageIcon, Bookmark, BookmarkCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import { useState, useEffect } from "react";
import { saveMessage, unsaveMessage, isMessageSaved } from "@/lib/savedMessagesService";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: string;
  timestamp: string;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
  type?: "text" | "image" | "file" | "voice";
  mediaUrl?: string;
  fileName?: string;
  onDelete?: () => void;
  className?: string;
  messageId?: string;
  chatId?: string;
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
  className,
  messageId,
  chatId,
}: MessageBubbleProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'unsaving'>('idle');

  // Check if message is saved
  useEffect(() => {
    if (messageId) {
      isMessageSaved(messageId).then(setIsSaved);
    }
  }, [messageId]);

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
              onClick={() => mediaUrl && window.open(mediaUrl, '_blank')}
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
      default:
        return <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>;
    }
  };

  const showMenu = onDelete || messageId;

  return (
    <>
      <div className={cn(
        "flex w-full group",
        isOwn ? "justify-end" : "justify-start",
        className
      )}>
        {/* Menu for own messages */}
        {isOwn && showMenu && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center mr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {messageId && (
                  <>
                    {isSaved ? (
                      <DropdownMenuItem 
                        onClick={handleUnsave}
                        disabled={savingState !== 'idle'}
                      >
                        <BookmarkCheck className="h-4 w-4 mr-2 text-primary" />
                        Unsave
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        onClick={handleSave}
                        disabled={savingState !== 'idle'}
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save message
                      </DropdownMenuItem>
                    )}
                    {onDelete && <DropdownMenuSeparator />}
                  </>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete message
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        <div className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2 transition-smooth",
          isOwn 
            ? "bg-chat-bubble-outgoing text-chat-text-outgoing" 
            : "bg-chat-bubble-incoming text-chat-text-incoming"
        )}>
          {renderContent()}
          <div className="flex items-center justify-end gap-1 mt-1">
            {isSaved && <Bookmark className="h-3 w-3 text-primary" />}
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

        {/* Menu for received messages (save only) */}
        {!isOwn && messageId && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {isSaved ? (
                  <DropdownMenuItem 
                    onClick={handleUnsave}
                    disabled={savingState !== 'idle'}
                  >
                    <BookmarkCheck className="h-4 w-4 mr-2 text-primary" />
                    Unsave
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={handleSave}
                    disabled={savingState !== 'idle'}
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save message
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

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
