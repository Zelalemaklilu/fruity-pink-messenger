import { useState, useEffect, useCallback } from "react";
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface MediaItem {
  url: string;
  type: "image" | "video";
  timestamp?: string;
}

interface MediaViewerProps {
  media: MediaItem[];
  initialIndex?: number;
  onClose: () => void;
}

export function MediaViewer({ media, initialIndex = 0, onClose }: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const current = media[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setZoom(1);
    }
  }, [currentIndex, media.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setZoom(1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape": onClose(); break;
        case "ArrowRight": goNext(); break;
        case "ArrowLeft": goPrev(); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  const handleDownload = () => {
    if (!current) return;
    const a = document.createElement("a");
    a.href = current.url;
    a.download = `media_${Date.now()}`;
    a.target = "_blank";
    a.click();
  };

  if (!current) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/95 flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4 z-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10" data-testid="button-close-viewer">
            <X className="h-5 w-5" />
          </Button>
          <span className="text-white/70 text-sm">
            {currentIndex + 1} / {media.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {current.type === "image" && (
            <>
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(z + 0.5, 3))} className="text-white hover:bg-white/10" data-testid="button-zoom-in">
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))} className="text-white hover:bg-white/10" data-testid="button-zoom-out">
                <ZoomOut className="h-5 w-5" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={handleDownload} className="text-white hover:bg-white/10" data-testid="button-download-media">
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden relative" onClick={e => e.stopPropagation()}>
        {media.length > 1 && currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            className="absolute left-4 text-white hover:bg-white/10 z-10"
            data-testid="button-media-prev"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-full max-h-full flex items-center justify-center"
          >
            {current.type === "image" ? (
              <img
                src={current.url}
                alt=""
                className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
                draggable={false}
              />
            ) : (
              <video
                src={current.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh]"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {media.length > 1 && currentIndex < media.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            className="absolute right-4 text-white hover:bg-white/10 z-10"
            data-testid="button-media-next"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>

      {current.timestamp && (
        <div className="p-4 text-center" onClick={e => e.stopPropagation()}>
          <span className="text-white/50 text-sm">{current.timestamp}</span>
        </div>
      )}
    </motion.div>
  );
}
