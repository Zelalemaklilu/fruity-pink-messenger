import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download } from "lucide-react";
import { exportChat, type ExportOptions } from "@/lib/chatExportService";
import { toast } from "sonner";

interface ChatExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string;
  messages: any[];
}

export function ChatExportDialog({
  isOpen,
  onClose,
  chatId,
  chatName,
  messages,
}: ChatExportDialogProps) {
  const [format, setFormat] = useState<"json" | "text">("json");
  const [includeMedia, setIncludeMedia] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleExport = () => {
    const options: ExportOptions = {
      chatId,
      chatName,
      format,
      includeMedia,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };

    try {
      exportChat(messages, options);
      toast.success("Chat exported successfully!");
      onClose();
    } catch {
      toast.error("Failed to export chat");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Export Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(val) => setFormat(val as "json" | "text")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="json" id="format-json" data-testid="radio-format-json" />
                <Label htmlFor="format-json" className="cursor-pointer">JSON</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="text" id="format-text" data-testid="radio-format-text" />
                <Label htmlFor="format-text" className="cursor-pointer">Plain Text</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="include-media">Include Media URLs</Label>
            <Switch
              id="include-media"
              checked={includeMedia}
              onCheckedChange={setIncludeMedia}
              data-testid="switch-include-media"
            />
          </div>

          <div className="space-y-2">
            <Label>Date Range (optional)</Label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                data-testid="input-date-from"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                data-testid="input-date-to"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {messages.length} message{messages.length !== 1 ? "s" : ""} will be exported
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-export">
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={messages.length === 0} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
