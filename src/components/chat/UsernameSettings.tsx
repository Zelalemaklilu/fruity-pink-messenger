export default function UsernameSettings({ userId, onClose, open }: { userId?: string; onClose: () => void; open?: boolean }) {
  if (open === false) return null;
  return <div className="p-4"><p className="text-foreground text-sm">Username settings coming soon</p><button className="mt-2 text-primary text-sm" onClick={onClose}>Close</button></div>;
}
