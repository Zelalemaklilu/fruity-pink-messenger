export default function PollCard({ poll, userId, onVote }: { poll: any; userId: string; onVote?: () => void }) {
  return <div className="bg-muted p-3 rounded-lg"><p className="font-medium text-foreground">{poll?.question || 'Poll'}</p></div>;
}
