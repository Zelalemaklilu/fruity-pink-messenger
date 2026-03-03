import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, X, Copy, QrCode, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  setUsername,
  getUsername,
  isUsernameAvailable,
  generateShareLink,
} from "@/lib/usernameService";
import { toast } from "sonner";

interface UsernameSettingsProps {
  userId: string;
  onClose?: () => void;
}

function QrCodeDisplay({ username }: { username: string }) {
  const seed = username.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const size = 21;
  const cellSize = 6;
  const svgSize = size * cellSize;

  const cells: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      const isFinderPattern =
        (x < 7 && y < 7) ||
        (x >= size - 7 && y < 7) ||
        (x < 7 && y >= size - 7);

      if (isFinderPattern) {
        const lx = x < 7 ? x : x >= size - 7 ? x - (size - 7) : x;
        const ly = y < 7 ? y : y >= size - 7 ? y - (size - 7) : y;
        cells[y][x] =
          lx === 0 || lx === 6 || ly === 0 || ly === 6 ||
          (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4);
      } else {
        const hash = ((seed * (x + 1) * (y + 1) + x * 7 + y * 13) % 100);
        cells[y][x] = hash < 45;
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-white p-3 rounded-lg">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {cells.map((row, y) =>
            row.map((filled, x) =>
              filled ? (
                <rect
                  key={`${x}-${y}`}
                  x={x * cellSize}
                  y={y * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="#000"
                />
              ) : null
            )
          )}
        </svg>
      </div>
      <span className="text-xs text-muted-foreground">@{username}</span>
    </div>
  );
}

export function UsernameSettings({ userId, onClose }: UsernameSettingsProps) {
  const [inputValue, setInputValue] = useState("");
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const existing = getUsername(userId);
    if (existing) {
      setCurrentUsername(existing);
      setInputValue(existing);
    }
  }, [userId]);

  const validateAndCheck = useCallback(
    (value: string) => {
      const normalized = value.toLowerCase().trim();
      setInputValue(normalized);

      if (!normalized) {
        setAvailable(null);
        setValidationError(null);
        return;
      }

      if (normalized.length < 3) {
        setValidationError("Minimum 3 characters");
        setAvailable(null);
        return;
      }

      if (normalized.length > 30) {
        setValidationError("Maximum 30 characters");
        setAvailable(null);
        return;
      }

      if (!/^[a-z0-9_]+$/.test(normalized)) {
        setValidationError("Only lowercase letters, numbers, and underscores");
        setAvailable(null);
        return;
      }

      setValidationError(null);

      if (normalized === currentUsername) {
        setAvailable(true);
        return;
      }

      setAvailable(isUsernameAvailable(normalized));
    },
    [currentUsername]
  );

  const handleSave = useCallback(() => {
    if (!inputValue || validationError || available === false) return;
    setSaving(true);

    const result = setUsername(userId, inputValue);
    if (result.success) {
      setCurrentUsername(inputValue);
      toast.success("Username saved!");
    } else {
      toast.error(result.error || "Failed to save username");
    }
    setSaving(false);
  }, [userId, inputValue, validationError, available]);

  const handleCopyLink = useCallback(() => {
    if (!currentUsername) return;
    const link = generateShareLink(currentUsername);
    navigator.clipboard.writeText(link).then(() => {
      toast.success("Link copied!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  }, [currentUsername]);

  const shareLink = currentUsername ? generateShareLink(currentUsername) : null;
  const hasChanges = inputValue !== currentUsername && inputValue.length > 0;

  return (
    <div className="space-y-6">
      {currentUsername && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
          <AtSign className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Current username</p>
            <p className="text-sm text-primary">@{currentUsername}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="username-input">Username</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <AtSign className="h-4 w-4" />
          </div>
          <Input
            id="username-input"
            data-testid="input-username"
            value={inputValue}
            onChange={(e) => validateAndCheck(e.target.value)}
            placeholder="your_username"
            className="pl-9 pr-9"
            maxLength={30}
          />
          {inputValue && !validationError && available !== null && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {available ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-destructive" />
              )}
            </div>
          )}
        </div>
        {validationError && (
          <p className="text-xs text-destructive" data-testid="text-username-error">
            {validationError}
          </p>
        )}
        {!validationError && available === false && (
          <p className="text-xs text-destructive" data-testid="text-username-taken">
            Username is already taken
          </p>
        )}
        {!validationError && available === true && hasChanges && (
          <p className="text-xs text-green-500" data-testid="text-username-available">
            Username is available
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          3-30 characters, lowercase letters, numbers, and underscores only
        </p>
      </div>

      <Button
        data-testid="button-save-username"
        onClick={handleSave}
        disabled={!hasChanges || !!validationError || available === false || saving}
        className="w-full"
      >
        {saving ? "Saving..." : "Save Username"}
      </Button>

      {shareLink && (
        <div className="space-y-3">
          <Label>Share Link</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 rounded-lg bg-muted text-sm text-foreground truncate" data-testid="text-share-link">
              {shareLink}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              data-testid="button-copy-link"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowQr(!showQr)}
            data-testid="button-toggle-qr"
          >
            <QrCode className="h-4 w-4 mr-2" />
            {showQr ? "Hide QR Code" : "Show QR Code"}
          </Button>

          {showQr && currentUsername && (
            <div className="flex justify-center py-2">
              <QrCodeDisplay username={currentUsername} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
