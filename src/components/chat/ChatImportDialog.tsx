export default function ChatImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center" onClick={onClose}><div className="bg-card p-6 rounded-lg" onClick={e => e.stopPropagation()}><p className="text-foreground">Import dialog coming soon</p><button className="mt-2 text-primary" onClick={onClose}>Close</button></div></div>;
}
