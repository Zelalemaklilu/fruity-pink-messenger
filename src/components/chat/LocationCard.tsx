export default function LocationCard({ lat, lng }: { lat: number; lng: number }) {
  return <div className="bg-muted p-3 rounded-lg"><p className="text-sm text-foreground">📍 Location: {lat.toFixed(4)}, {lng.toFixed(4)}</p></div>;
}
