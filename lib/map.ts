import { Driver, MarkerData } from "@/types/type";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? "";

// ─── Haversine — distância em km entre dois pontos ───────────────────────────
const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Tempo de percurso via Google Directions (fallback: haversine) ────────────
const getGoogleDuration = async (
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
): Promise<number> => {
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${originLat},${originLon}` +
      `&destination=${destLat},${destLon}` +
      `&key=${GOOGLE_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.routes?.[0]?.legs?.[0]?.duration?.value) {
      return data.routes[0].legs[0].duration.value; // segundos
    }

    // Fallback: estima 40 km/h em área urbana
    const distKm = haversineDistance(originLat, originLon, destLat, destLon);
    return (distKm / 40) * 3600;
  } catch {
    const distKm = haversineDistance(originLat, originLon, destLat, destLon);
    return (distKm / 40) * 3600;
  }
};

// ─── Gera markers dos motoristas ao redor do usuário ─────────────────────────
export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;

    return {
      ...driver,
      id: driver.driver_id,           // MarkerData exige 'id', Driver tem 'driver_id'
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
    };
  });
};

// ─── Calcula região do mapa ───────────────────────────────────────────────────
export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: -23.5505,
      longitude: -46.6333,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  return {
    latitude: (userLatitude + destinationLatitude) / 2,
    longitude: (userLongitude + destinationLongitude) / 2,
    latitudeDelta: (maxLat - minLat) * 1.3 || 0.01,
    longitudeDelta: (maxLng - minLng) * 1.3 || 0.01,
  };
};

// ─── Calcula tempo e preço de cada motorista até o destino ───────────────────
export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  )
    return;

  try {
    const timesPromises = markers.map(async (marker) => {
      const timeToUser = await getGoogleDuration(
        marker.latitude,
        marker.longitude,
        userLatitude,
        userLongitude,
      );

      const timeToDestination = await getGoogleDuration(
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude,
      );

      const totalTime = (timeToUser + timeToDestination) / 60; // minutos
      const price = (totalTime * 0.5).toFixed(2);

      return { ...marker, time: totalTime, price };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    console.error("Erro ao calcular tempos:", error);
    // Retorna markers com valores estimados em vez de crashar
    return markers.map((marker) => ({
      ...marker,
      time: Math.floor(Math.random() * 15) + 5,
      price: (Math.random() * 20 + 5).toFixed(2),
    }));
  }
};
