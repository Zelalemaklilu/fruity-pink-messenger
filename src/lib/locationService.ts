export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Location permission denied"));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information unavailable"));
            break;
          case error.TIMEOUT:
            reject(new Error("Location request timed out"));
            break;
          default:
            reject(new Error("Failed to get location"));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  });
}

export function getStaticMapUrl(lat: number, lng: number, zoom?: number): string {
  const offset = zoom ? 0.05 / (zoom / 2) : 0.005;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - offset},${lat - offset},${lng + offset},${lat + offset}&layer=mapnik&marker=${lat},${lng}`;
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function getGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
