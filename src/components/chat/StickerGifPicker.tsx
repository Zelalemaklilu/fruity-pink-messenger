export default function StickerGifPicker({ isOpen, open, onClose, onSelect, onSelectSticker }: { isOpen?: boolean; open?: boolean; onClose: () => void; onSelect?: (sticker: string) => void; onSelectSticker?: (sticker: any) => void }) {
  const visible = isOpen ?? open ?? false;
  if (!visible) return null;
  return <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center" onClick={onClose}><div className="bg-card p-6 rounded-lg" onClick={e => e.stopPropagation()}><p className="text-foreground">Sticker picker coming soon</p><button className="mt-2 text-primary" onClick={onClose}>Close</button></div></div>;
}
