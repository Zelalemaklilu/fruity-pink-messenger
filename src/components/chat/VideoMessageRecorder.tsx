export default function VideoMessageRecorder({ onSend, onCancel, open, onClose, onRecorded }: { onSend?: (blob: Blob) => void; onCancel?: () => void; open?: boolean; onClose?: () => void; onRecorded?: (blob: Blob) => void }) {
  if (open === false) return null;
  const handleClose = () => { onCancel?.(); onClose?.(); };
  return <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center" onClick={handleClose}><div className="bg-card p-6 rounded-lg" onClick={e => e.stopPropagation()}><p className="text-foreground">Video recorder coming soon</p><button className="mt-2 text-primary" onClick={handleClose}>Close</button></div></div>;
}
