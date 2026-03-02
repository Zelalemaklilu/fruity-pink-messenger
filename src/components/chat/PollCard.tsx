export default function PollCard({ poll, currentUserId, userId, onVote, onClose }: { poll: any; currentUserId?: string; userId?: string; onVote?: (pollId: string, optionId: string) => void; onClose?: (pollId: string) => void }) {
  return <div className="bg-muted p-3 rounded-lg"><p className="font-medium text-foreground">{poll?.question || 'Poll'}</p><p className="text-xs text-muted-foreground mt-1">Poll functionality coming soon</p></div>;
}
