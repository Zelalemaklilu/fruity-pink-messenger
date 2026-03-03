
import { MapPin } from "lucide-react";

interface LocationCardProps {
  latitude: number;
  longitude: number;
  isOwn?: boolean;
}

export default function LocationCard({ latitude, longitude, isOwn }: LocationCardProps) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className="rounded-lg overflow-hidden border border-border bg-background w-64">
      <iframe
        width="100%"
        height="150"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        className="w-full"
      ></iframe>
      <div className="p-2 flex items-center gap-2 bg-muted/50">
        <MapPin className="h-4 w-4 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">Location</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
      </div>
    </div>
  );
}
