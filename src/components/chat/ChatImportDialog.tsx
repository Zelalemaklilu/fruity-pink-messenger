import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { importChat } from "@/lib/chatExportService";
import { toast } from "sonner";

interface ChatImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  onImport: (messages: any[]) => void;
}

export function ChatImportDialog({
  isOpen,
  onClose,
  chatId,
  onImport,
}: ChatImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    messageCount: number;
    dateRange?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setPreview(null);

    const result = await importChat(file);
    if (result.success) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const msgs = data.messages || [];
        let dateRange: string | undefined;

        if (msgs.length > 0) {
          const timestamps = msgs
            .map((m: any) => m.timestamp || m.created_at || "")
            .filter((t: string) => t)
            .sort();
          if (timestamps.length > 0) {
            const first = new Date(timestamps[0]).toLocaleDateString();
            const last = new Date(timestamps[timestamps.length - 1]).toLocaleDateString();
            dateRange = first === last ? first : `${first} - ${last}`;
          }
        }

        setPreview({
          messageCount: result.messageCount,
          dateRange,
        });
      } catch {
        setPreview({ messageCount: result.messageCount });
      }
    } else {
      setError(result.error || "Invalid file");
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);

    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);
      const msgs = data.messages || [];
      onImport(msgs);
      toast.success(`Imported ${msgs.length} message${msgs.length !== 1 ? "s" : ""}`);
      handleReset();
      onClose();
    } catch {
      toast.error("Failed to import chat");
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleReset(); onClose(); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Import Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Select File</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-import-file"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-select-file"
            >
              <Upload className="h-4 w-4 mr-2" />
              {selectedFile ? selectedFile.name : "Choose .json file"}
            </Button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm" data-testid="text-import-error">{error}</p>
            </div>
          )}

          {preview && (
            <div className="p-3 rounded-lg bg-muted space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Preview</span>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-import-count">
                {preview.messageCount} message{preview.messageCount !== 1 ? "s" : ""}
              </p>
              {preview.dateRange && (
                <p className="text-sm text-muted-foreground" data-testid="text-import-date-range">
                  Date range: {preview.dateRange}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { handleReset(); onClose(); }} data-testid="button-cancel-import">
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!preview || !!error || importing}
            data-testid="button-import"
          >
            {importing ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
