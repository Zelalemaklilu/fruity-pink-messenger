import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, FileIcon, Play, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface MediaItem {
  id: string;
  media_url: string;
  file_name: string | null;
  message_type: string;
  created_at: string;
}

interface MediaGalleryProps {
  chatId: string;
  onClose: () => void;
}

export function MediaGallery({ chatId, onClose }: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("id, media_url, file_name, message_type, created_at")
        .eq("chat_id", chatId)
        .not("media_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        setMedia(data as MediaItem[]);
      }
      setLoading(false);
    };
    load();
  }, [chatId]);

  const images = media.filter((m) => m.message_type === "image");
  const files = media.filter((m) => m.message_type === "file");
  const voice = media.filter((m) => m.message_type === "voice");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Shared Media</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Tabs defaultValue="photos" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="photos" className="flex-1">
            <ImageIcon className="h-4 w-4 mr-1" />
            Photos ({images.length})
          </TabsTrigger>
          <TabsTrigger value="files" className="flex-1">
            <FileIcon className="h-4 w-4 mr-1" />
            Files ({files.length})
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex-1">
            <Play className="h-4 w-4 mr-1" />
            Voice ({voice.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : images.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No photos shared yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {images.map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="aspect-square cursor-pointer overflow-hidden rounded-sm"
                  onClick={() => setSelectedImage(img.media_url)}
                >
                  <img
                    src={img.media_url}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="files" className="flex-1 overflow-auto p-4">
          {files.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No files shared yet</p>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={file.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <FileIcon className="h-8 w-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name || "File"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="voice" className="flex-1 overflow-auto p-4">
          {voice.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No voice messages yet</p>
          ) : (
            <div className="space-y-2">
              {voice.map((v) => (
                <div key={v.id} className="p-3 rounded-lg bg-muted">
                  <audio controls className="w-full">
                    <source src={v.media_url} type="audio/webm" />
                  </audio>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(v.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Full-size image viewer */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img src={selectedImage} alt="" className="max-w-full max-h-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
