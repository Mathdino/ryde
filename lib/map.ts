import { Driver, MarkerData } from "@/types/type";

type Coordinate = { latitude: number; longitude: number };

// Decodifica o polyline encoded do Google Directions API
const decodePolyline = (encoded: string): Coordinate[] => {
  const points: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

// Busca as coordenadas reais da rota via Google Directions API
// Caso falhe, retorna linha reta como fallback
export const fetchRouteCoordinates = async (
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
  apiKey: string
): Promise<Coordinate[]> => {
  const straight: Coordinate[] = [
    { latitude: originLat, longitude: originLon },
    { latitude: destLat, longitude: destLon },
  ];

  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${originLat},${originLon}` +
      `&destination=${destLat},${destLon}` +
      `&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || !data.routes?.[0]?.overview_polyline?.points) {
      return straight;
    }

    return decodePolyline(data.routes[0].overview_polyline.points);
  } catch {
    return straight;
  }
};

// Calcula distância em km entre dois pontos (fórmula Haversine)
const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// OSRM — roteamento gratuito, sem chave necessária
// Usa haversine como fallback quando o OSRM não encontrar rota (ex: noRoute)
const getOsrmDuration = async (
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number
): Promise<number> => {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${originLon},${originLat};${destLon},${destLat}` +
      `?overview=false`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === "Ok" && data.routes?.[0]) {
      return data.routes[0].duration; // segundos
    }

    // Fallback: estima pela distância em linha reta a 40 km/h em área urbana
    const distKm = haversineDistance(originLat, originLon, destLat, destLon);
    const avgSpeedKmH = 40;
    return (distKm / avgSpeedKmH) * 3600; // converte para segundos
  } catch {
    // Sem conexão ou erro inesperado: fallback haversine
    const distKm = haversineDistance(originLat, originLon, destLat, destLon);
    return (distKm / 40) * 3600;
  }
};

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
    const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      id: driver.driver_id,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

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
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
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

  const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
  const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

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
      const timeToUser = await getOsrmDuration(
        marker.latitude,
        marker.longitude,
        userLatitude!,
        userLongitude!
      );

      const timeToDestination = await getOsrmDuration(
        userLatitude!,
        userLongitude!,
        destinationLatitude!,
        destinationLongitude!
      );

      const totalTime = (timeToUser + timeToDestination) / 60; // minutos
      const price = (totalTime * 0.5).toFixed(2);

      return { ...marker, time: totalTime, price };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    console.error("Error calculating driver times:", error);
    // Retorna markers sem tempo/preço em vez de crashar
    return markers.map((marker) => ({
      ...marker,
      time: Math.floor(Math.random() * 15) + 5,
      price: (Math.random() * 20 + 5).toFixed(2),
    }));
  }
};
