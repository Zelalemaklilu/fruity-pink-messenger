export default function ForwardPicker({ messageText, messageType, mediaUrl, onClose, open, onForward }: { messageText?: string; messageType?: string; mediaUrl?: string; onClose: () => void; open?: boolean; onForward?: (id: string) => void }) {
  if (open === false) return null;
  return <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center" onClick={onClose}><div className="bg-card p-6 rounded-lg" onClick={e => e.stopPropagation()}><p className="text-foreground">Forward picker coming soon</p><button className="mt-2 text-primary" onClick={onClose}>Close</button></div></div>;
}
