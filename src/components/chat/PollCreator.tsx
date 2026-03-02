export default function PollCreator({ chatId, currentUserId, open, onClose, onCreated }: { chatId: string; currentUserId?: string; open: boolean; onClose: () => void; onCreated?: (poll?: any) => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center" onClick={onClose}><div className="bg-card p-6 rounded-lg" onClick={e => e.stopPropagation()}><p className="text-foreground">Poll creator coming soon</p><button className="mt-2 text-primary" onClick={onClose}>Close</button></div></div>;
}
