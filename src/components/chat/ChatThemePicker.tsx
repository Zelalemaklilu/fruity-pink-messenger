import { useState } from "react";
import { Palette, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getChatTheme,
  setChatTheme,
  removeChatTheme,
  getPresetThemes,
  type ChatTheme,
} from "@/lib/chatThemeService";

interface ChatThemePickerProps {
  chatId: string;
  open: boolean;
  onClose: () => void;
}

const FONT_SIZES: Array<{ label: string; value: ChatTheme["fontSize"] }> = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

export function ChatThemePicker({ chatId, open, onClose }: ChatThemePickerProps) {
  const presets = getPresetThemes();
  const [currentTheme, setCurrentTheme] = useState<ChatTheme | null>(() =>
    getChatTheme(chatId),
  );

  const selectedBubble = currentTheme?.bubbleColor || "";
  const selectedFontSize = currentTheme?.fontSize || "medium";

  const handleSelectPreset = (preset: (typeof presets)[number]) => {
    setChatTheme(chatId, {
      bubbleColor: preset.bubbleColor,
      accentColor: preset.accentColor,
    });
    setCurrentTheme(getChatTheme(chatId));
  };

  const handleFontSize = (size: ChatTheme["fontSize"]) => {
    setChatTheme(chatId, { fontSize: size });
    setCurrentTheme(getChatTheme(chatId));
  };

  const handleReset = () => {
    removeChatTheme(chatId);
    setCurrentTheme(null);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-xl" data-testid="sheet-theme-picker">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Chat Theme
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Color Theme</p>
            <div className="grid grid-cols-4 gap-4">
              {presets.map((preset) => {
                const isSelected = selectedBubble === preset.bubbleColor;
                const circleColor = preset.bubbleColor || "hsl(var(--muted))";
                return (
                  <button
                    key={preset.name}
                    onClick={() => handleSelectPreset(preset)}
                    data-testid={`button-theme-${preset.name.toLowerCase()}`}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="relative h-12 w-12 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: circleColor,
                        borderColor: isSelected
                          ? "hsl(var(--primary))"
                          : "hsl(var(--border))",
                      }}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="h-5 w-5 text-white drop-shadow-md" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Font Size</p>
            <div className="inline-flex rounded-md border border-border overflow-visible">
              {FONT_SIZES.map((fs) => {
                const isActive = selectedFontSize === fs.value;
                return (
                  <button
                    key={fs.value}
                    onClick={() => handleFontSize(fs.value)}
                    data-testid={`button-fontsize-${fs.value}`}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover-elevate"
                    } ${fs.value === "small" ? "rounded-l-md" : ""} ${fs.value === "large" ? "rounded-r-md" : ""}`}
                  >
                    {fs.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleReset}
            data-testid="button-reset-theme"
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default ChatThemePicker;
