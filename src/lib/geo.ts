/** Request browser GPS; rejects if denied or unavailable (required for attendance). */
export function getCurrentPosition(): Promise<{ lat: number; lng: number; accuracyM?: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This device does not support GPS. Use a phone or browser with location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location permission denied. Enable GPS for this site and try again."));
        } else {
          reject(new Error("Could not read your location. Move outdoors or check GPS, then try again."));
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  });
}

export function workSiteLabel(site?: string | null): string {
  if (site === "workstation") return "Workstation";
  if (site === "studio") return "Studio";
  return "Not assigned";
}
