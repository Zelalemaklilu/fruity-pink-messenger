import { useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Check, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Poll } from "@/lib/pollService";

interface PollCardProps {
  poll: Poll;
  currentUserId: string;
  onVote: (pollId: string, optionId: string) => void;
  onClose?: (pollId: string) => void;
}

export function PollCard({ poll, currentUserId, onVote, onClose }: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
  const userVotedOptionIds = new Set(
    poll.options.filter((o) => o.votes.includes(currentUserId)).map((o) => o.id),
  );
  const hasVoted = userVotedOptionIds.size > 0;
  const isCreator = poll.createdBy === currentUserId;

  function getPercentage(voteCount: number) {
    if (totalVotes === 0) return 0;
    return Math.round((voteCount / totalVotes) * 100);
  }

  function handleOptionClick(optionId: string) {
    if (poll.closed) return;

    if (hasVoted || !poll.allowMultiple) {
      onVote(poll.id, optionId);
      return;
    }

    const next = new Set(selectedOptions);
    if (next.has(optionId)) {
      next.delete(optionId);
    } else {
      next.add(optionId);
    }
    setSelectedOptions(next);
  }

  function handleSubmitVotes() {
    selectedOptions.forEach((optionId) => {
      onVote(poll.id, optionId);
    });
    setSelectedOptions(new Set());
  }

  const showResults = hasVoted || poll.closed;

  return (
    <Card className="rounded-md w-full max-w-sm" data-testid={`card-poll-${poll.id}`}>
      <CardHeader className="flex flex-row items-start gap-2 p-4 pb-2">
        <BarChart3 className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span
            className="text-sm font-semibold text-foreground leading-tight"
            data-testid="text-poll-question"
          >
            {poll.question}
          </span>
          {poll.closed && (
            <Badge variant="secondary" className="self-start text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Poll closed
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 p-4 pt-0">
        <AnimatePresence mode="wait">
          {poll.options.map((option) => {
            const pct = getPercentage(option.votes.length);
            const isSelected = userVotedOptionIds.has(option.id) || selectedOptions.has(option.id);

            return (
              <motion.button
                key={option.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                data-testid={`button-vote-${option.id}`}
                disabled={poll.closed}
                onClick={() => handleOptionClick(option.id)}
                className={`relative rounded-md overflow-hidden text-left w-full p-2.5 transition-colors border ${
                  isSelected
                    ? "border-foreground/30 bg-muted"
                    : "border-border bg-muted/50 hover-elevate"
                } ${poll.closed ? "cursor-default" : "cursor-pointer"}`}
              >
                {showResults && (
                  <motion.div
                    className="absolute inset-0 bg-primary/20 rounded-md"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    data-testid={`progress-option-${option.id}`}
                  >
                    <div className="absolute inset-0 bg-primary/20" />
                  </motion.div>
                )}

                <div className="relative flex items-center gap-2 z-10">
                  <span
                    className={`flex items-center justify-center h-4 w-4 shrink-0 rounded-${
                      poll.allowMultiple ? "sm border" : "full border"
                    } ${
                      isSelected
                        ? "bg-foreground/80 border-foreground/80"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-background" />}
                  </span>

                  <span className="text-sm text-foreground flex-1 truncate">
                    {option.text}
                  </span>

                  {showResults && (
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {option.votes.length} ({pct}%)
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {!hasVoted && !poll.closed && poll.allowMultiple && selectedOptions.size > 0 && (
          <Button
            size="sm"
            data-testid="button-submit-votes"
            onClick={handleSubmitVotes}
          >
            Vote
          </Button>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 p-4 pt-0">
        <span className="text-xs text-muted-foreground">
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </span>
        {isCreator && !poll.closed && onClose && (
          <Button
            variant="ghost"
            size="sm"
            data-testid="button-close-poll"
            onClick={() => onClose(poll.id)}
          >
            Close poll
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
