export default function MediaViewer({ media, initialIndex, url, type, onClose }: { media?: { url: string; type: string; timestamp?: string }[]; initialIndex?: number; url?: string; type?: string; onClose: () => void }) {
  const displayUrl = url || media?.[initialIndex || 0]?.url || "";
  const displayType = type || media?.[initialIndex || 0]?.type || "image";
  return <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>{displayType === 'video' ? <video src={displayUrl} controls className="max-w-full max-h-full" /> : <img src={displayUrl} className="max-w-full max-h-full object-contain" />}</div>;
}
