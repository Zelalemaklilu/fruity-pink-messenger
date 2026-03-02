import { getHostname, getFaviconUrl, truncateUrl } from "@/lib/linkPreviewService";
import { ExternalLink } from "lucide-react";

interface LinkPreviewCardProps {
  url: string;
}

export function LinkPreviewCard({ url }: LinkPreviewCardProps) {
  const hostname = getHostname(url);
  const faviconUrl = getFaviconUrl(hostname);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2 mt-1.5 p-2 rounded-lg bg-background/10 border border-border/30 hover:bg-background/20 transition-colors cursor-pointer no-underline"
      data-testid={`link-preview-card-${hostname}`}
    >
      <img
        src={faviconUrl}
        alt=""
        className="w-4 h-4 rounded-sm flex-shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
        data-testid="link-preview-favicon"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" data-testid="link-preview-hostname">
          {hostname}
        </p>
        <p className="text-xs opacity-60 truncate" data-testid="link-preview-url">
          {truncateUrl(url, 45)}
        </p>
      </div>
      <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
    </a>
  );
}
