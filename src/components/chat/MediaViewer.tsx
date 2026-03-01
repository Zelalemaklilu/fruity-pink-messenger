export default function MediaViewer({ url, type, onClose }: { url: string; type: string; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>{type === 'video' ? <video src={url} controls className="max-w-full max-h-full" /> : <img src={url} className="max-w-full max-h-full object-contain" />}</div>;
}
