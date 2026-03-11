import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Star, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getAllPacks,
  getRecentStickers,
  getFavoriteStickers,
  addRecentSticker,
  toggleFavoriteSticker,
  searchStickers,
  type Sticker,
  type StickerPack,
} from "@/lib/stickerService";

interface StickerGifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: Sticker) => void;
}

export function StickerGifPicker({ isOpen, onClose, onSelectSticker }: StickerGifPickerProps) {
  const [activeTab, setActiveTab] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Sticker[]>([]);
  const [recentStickers, setRecentStickers] = useState<Sticker[]>([]);
  const [favoriteStickers, setFavoriteStickers] = useState<Sticker[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const packs = getAllPacks();

  useEffect(() => {
    if (isOpen) {
      setRecentStickers(getRecentStickers());
      const favs = getFavoriteStickers();
      setFavoriteStickers(favs);
      setFavoriteIds(new Set(favs.map((s) => s.id)));
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(searchStickers(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSelectSticker = useCallback(
    (sticker: Sticker) => {
      addRecentSticker(sticker);
      onSelectSticker(sticker);
    },
    [onSelectSticker],
  );

  const handleLongPressStart = useCallback((sticker: Sticker) => {
    longPressTimerRef.current = setTimeout(() => {
      toggleFavoriteSticker(sticker);
      const favs = getFavoriteStickers();
      setFavoriteStickers(favs);
      setFavoriteIds(new Set(favs.map((s) => s.id)));
      setRecentStickers((prev) => [...prev]);
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const getStickersForTab = (): Sticker[] => {
    if (searchQuery.trim()) return searchResults;
    if (activeTab === "recent") return recentStickers;
    if (activeTab === "favorites") return favoriteStickers;
    const pack = packs.find((p) => p.id === activeTab);
    return pack ? pack.stickers : [];
  };

  const displayStickers = getStickersForTab();

  const tabs: { id: string; label: string; icon?: typeof Clock }[] = [
    { id: "recent", label: "Recent", icon: Clock },
    { id: "favorites", label: "Favorites", icon: Star },
    ...packs.map((p) => ({ id: p.id, label: p.name })),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="flex-shrink-0 bg-background border-t border-border z-20"
          style={{ maxHeight: "50vh" }}
          data-testid="panel-sticker-picker"
        >
          <div className="flex flex-col h-full" style={{ maxHeight: "50vh" }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  placeholder="Search stickers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 border-0 bg-muted rounded-full text-sm"
                  data-testid="input-sticker-search"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-sticker-picker">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!searchQuery.trim() && (
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border overflow-x-auto flex-shrink-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                    data-testid={`tab-sticker-${tab.id}`}
                  >
                    {tab.icon && <tab.icon className="h-3 w-3" />}
                    {!tab.icon && packs.find((p) => p.id === tab.id) && (
                      <span className="text-sm leading-none">
                        {packs.find((p) => p.id === tab.id)?.icon}
                      </span>
                    )}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
              {displayStickers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  {searchQuery.trim() ? (
                    <>
                      <Search className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm" data-testid="text-no-search-results">No stickers found</p>
                    </>
                  ) : activeTab === "recent" ? (
                    <>
                      <Clock className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm" data-testid="text-no-recent">No recent stickers</p>
                    </>
                  ) : activeTab === "favorites" ? (
                    <>
                      <Heart className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm" data-testid="text-no-favorites">No favorite stickers</p>
                      <p className="text-xs mt-1">Long-press a sticker to add</p>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1">
                  {displayStickers.map((sticker) => (
                    <motion.button
                      key={sticker.id}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleSelectSticker(sticker)}
                      onPointerDown={() => handleLongPressStart(sticker)}
                      onPointerUp={handleLongPressEnd}
                      onPointerLeave={handleLongPressEnd}
                      className="relative flex flex-col items-center justify-center p-2 rounded-md hover:bg-muted aspect-square"
                      data-testid={`sticker-${sticker.id}`}
                    >
                      <span className="text-2xl leading-none select-none">
                        {sticker.emoji}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
                        {sticker.label}
                      </span>
                      {favoriteIds.has(sticker.id) && (
                        <Star className="absolute top-0.5 right-0.5 h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StickerGifPicker;
