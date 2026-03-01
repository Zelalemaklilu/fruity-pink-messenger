import { useState, useEffect } from "react";
import { ArrowLeft, Database, HardDrive, Download, Trash2, FileDown, Image, Video, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const SETTINGS_KEY = "zeshopp_data_storage_settings";

interface DataStorageSettingsData {
  autoDownloadPhotos: boolean;
  autoDownloadVideos: boolean;
  autoDownloadFiles: boolean;
  dataSaverMode: boolean;
  lessDataForCalls: boolean;
}

function getDefaults(): DataStorageSettingsData {
  return {
    autoDownloadPhotos: true,
    autoDownloadVideos: false,
    autoDownloadFiles: false,
    dataSaverMode: false,
    lessDataForCalls: false,
  };
}

function loadSettings(): DataStorageSettingsData {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...getDefaults(), ...JSON.parse(stored) };
  } catch {}
  return getDefaults();
}

function saveSettings(settings: DataStorageSettingsData) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

function estimateStorageUsed(): string {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        total += key.length + (localStorage.getItem(key)?.length || 0);
      }
    }
    const bytes = total * 2;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } catch {
    return "Unknown";
  }
}

const DataStorageSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<DataStorageSettingsData>(loadSettings);
  const [storageUsed, setStorageUsed] = useState(estimateStorageUsed());
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [showDeleteChatsDialog, setShowDeleteChatsDialog] = useState(false);

  useEffect(() => {
    setStorageUsed(estimateStorageUsed());
  }, []);

  const update = (partial: Partial<DataStorageSettingsData>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  };

  const handleClearCache = () => {
    try {
      const keysToKeep = [
        SETTINGS_KEY,
        "zeshopp_notification_settings",
        "zeshopp-theme",
        "zeshopp-accent-color",
        "zeshopp-default-sound",
      ];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key) && !key.startsWith("sb-")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      setStorageUsed(estimateStorageUsed());
      toast.success("Cache cleared successfully");
    } catch {
      toast.error("Failed to clear cache");
    }
    setShowClearCacheDialog(false);
  };

  const handleDeleteAllChats = () => {
    try {
      const chatKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("chat") || key.includes("message"))) {
          chatKeys.push(key);
        }
      }
      chatKeys.forEach((key) => localStorage.removeItem(key));
      setStorageUsed(estimateStorageUsed());
      toast.success("All chats deleted");
    } catch {
      toast.error("Failed to delete chats");
    }
    setShowDeleteChatsDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Data and Storage</h1>
        </div>
      </div>

      <div className="px-4 pt-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Storage Usage</h3>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Storage Used</span>
                <p className="text-xs text-muted-foreground" data-testid="text-storage-used">{storageUsed}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setShowClearCacheDialog(true)}
            data-testid="button-clear-cache"
          >
            <Trash2 className="h-5 w-5 mr-3 text-muted-foreground" />
            Clear Cache
          </Button>
        </Card>
      </div>

      <div className="px-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Auto-Download</h3>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Image className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Photos</span>
                <p className="text-xs text-muted-foreground">Auto-download photos</p>
              </div>
            </div>
            <Switch
              checked={settings.autoDownloadPhotos}
              onCheckedChange={(v) => update({ autoDownloadPhotos: v })}
              data-testid="switch-auto-download-photos"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Videos</span>
                <p className="text-xs text-muted-foreground">Auto-download videos</p>
              </div>
            </div>
            <Switch
              checked={settings.autoDownloadVideos}
              onCheckedChange={(v) => update({ autoDownloadVideos: v })}
              data-testid="switch-auto-download-videos"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <FileIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Files</span>
                <p className="text-xs text-muted-foreground">Auto-download files</p>
              </div>
            </div>
            <Switch
              checked={settings.autoDownloadFiles}
              onCheckedChange={(v) => update({ autoDownloadFiles: v })}
              data-testid="switch-auto-download-files"
            />
          </div>
        </Card>
      </div>

      <div className="px-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Data Saver</h3>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Data Saver Mode</span>
                <p className="text-xs text-muted-foreground">Reduce media quality</p>
              </div>
            </div>
            <Switch
              checked={settings.dataSaverMode}
              onCheckedChange={(v) => update({ dataSaverMode: v })}
              data-testid="switch-data-saver"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Use Less Data for Calls</span>
                <p className="text-xs text-muted-foreground">Lower quality audio calls</p>
              </div>
            </div>
            <Switch
              checked={settings.lessDataForCalls}
              onCheckedChange={(v) => update({ lessDataForCalls: v })}
              data-testid="switch-less-data-calls"
            />
          </div>
        </Card>
      </div>

      <div className="px-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Chat History</h3>

        <Card className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => toast.info("Export feature coming soon")}
            data-testid="button-export-chat"
          >
            <FileDown className="h-5 w-5 mr-3 text-muted-foreground" />
            Export Chat History
          </Button>
        </Card>

        <Card className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => setShowDeleteChatsDialog(true)}
            data-testid="button-delete-all-chats"
          >
            <Trash2 className="h-5 w-5 mr-3" />
            Delete All Chats
          </Button>
        </Card>
      </div>

      <Dialog open={showClearCacheDialog} onOpenChange={setShowClearCacheDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear Cache</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will clear cached data. Your account, settings, and chat history will be preserved.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowClearCacheDialog(false)} data-testid="button-cancel-clear-cache">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearCache} data-testid="button-confirm-clear-cache">
              Clear Cache
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteChatsDialog} onOpenChange={setShowDeleteChatsDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete All Chats</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. All your chat history will be permanently deleted.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteChatsDialog(false)} data-testid="button-cancel-delete-chats">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllChats} data-testid="button-confirm-delete-chats">
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-16" />
    </div>
  );
};

export default DataStorageSettings;
