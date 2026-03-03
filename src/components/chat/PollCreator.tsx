import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BarChart3, Plus, X } from "lucide-react";
import { createPoll, type Poll } from "@/lib/pollService";

interface PollCreatorProps {
  chatId: string;
  currentUserId: string;
  onCreated: (poll: Poll) => void;
  onClose: () => void;
  open: boolean;
}

export function PollCreator({ chatId, currentUserId, onCreated, onClose, open }: PollCreatorProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const canCreate =
    question.trim().length > 0 &&
    options.filter((o) => o.trim().length > 0).length >= 2;

  function handleAddOption() {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  }

  function handleRemoveOption(index: number) {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  }

  function handleOptionChange(index: number, value: string) {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  }

  function handleCreate() {
    if (!canCreate) return;
    const validOptions = options.filter((o) => o.trim().length > 0);
    const poll = createPoll(chatId, question.trim(), validOptions, currentUserId, isAnonymous, allowMultiple);
    setQuestion("");
    setOptions(["", ""]);
    setIsAnonymous(false);
    setAllowMultiple(false);
    onCreated(poll);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Create Poll
          </DialogTitle>
          <DialogDescription>
            Create a poll for the chat members to vote on.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="poll-question">Question</Label>
            <Input
              id="poll-question"
              data-testid="input-poll-question"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Options</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  data-testid={`input-poll-option-${i}`}
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                />
                {options.length > 2 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    data-testid={`button-remove-option-${i}`}
                    onClick={() => handleRemoveOption(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <Button
                variant="outline"
                size="sm"
                data-testid="button-add-option"
                onClick={handleAddOption}
                className="self-start"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add option
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="switch-anonymous">Anonymous voting</Label>
              <Switch
                id="switch-anonymous"
                data-testid="switch-anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="switch-multiple">Allow multiple answers</Label>
              <Switch
                id="switch-multiple"
                data-testid="switch-multiple"
                checked={allowMultiple}
                onCheckedChange={setAllowMultiple}
              />
            </div>
          </div>

          <Button
            data-testid="button-create-poll"
            onClick={handleCreate}
            disabled={!canCreate}
          >
            Create Poll
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
