import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";

import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  fetchRouteCoordinates,
  generateMarkersFromData,
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";

type Coordinate = { latitude: number; longitude: number };

const googleAPI = process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? "";

const Map = ({ showRoutes = false }: { showRoutes?: boolean }) => {
  const {
    data: fetchedDrivers,
    loading,
    error,
  } = useFetch<Driver[]>("/(api)/driver");

  const {
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  const {
    selectedDriver,
    setDrivers,
    drivers: storedDrivers,
  } = useDriverStore();

  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [driverRoute, setDriverRoute] = useState<Coordinate[]>([]);
  const [destinationRoute, setDestinationRoute] = useState<Coordinate[]>([]);

  // Gera markers ao redor do usuário com os motoristas do banco
  useEffect(() => {
    if (!userLatitude || !userLongitude || !fetchedDrivers?.length) return;
    const newMarkers = generateMarkersFromData({
      data: fetchedDrivers,
      userLatitude,
      userLongitude,
    });
    setMarkers(newMarkers);
  }, [userLatitude, userLongitude, fetchedDrivers]);

  // Calcula tempos quando houver destino
  useEffect(() => {
    if (
      markers.length > 0 &&
      destinationLatitude != null &&
      destinationLongitude != null
    ) {
      calculateDriverTimes({
        markers,
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude,
      }).then((d) => {
        if (d) setDrivers(d as MarkerData[]);
      });
    }
  }, [markers, destinationLatitude, destinationLongitude]);

  // Rota do motorista selecionado → usuário
  useEffect(() => {
    const selectedMarker =
      markers.find((m) => m.id === selectedDriver) ??
      storedDrivers.find((m) => m.id === selectedDriver);

    if (!selectedMarker || !userLatitude || !userLongitude) {
      setDriverRoute([]);
      return;
    }

    fetchRouteCoordinates(
      selectedMarker.latitude,
      selectedMarker.longitude,
      userLatitude,
      userLongitude,
      googleAPI,
    ).then(setDriverRoute);
  }, [selectedDriver, markers, storedDrivers, userLatitude, userLongitude]);

  // Rota do usuário → destino
  useEffect(() => {
    if (
      !userLatitude ||
      !userLongitude ||
      !destinationLatitude ||
      !destinationLongitude
    ) {
      setDestinationRoute([]);
      return;
    }

    fetchRouteCoordinates(
      userLatitude,
      userLongitude,
      destinationLatitude,
      destinationLongitude,
      googleAPI,
    ).then(setDestinationRoute);
  }, [userLatitude, userLongitude, destinationLatitude, destinationLongitude]);

  const region = calculateRegion({
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  });

  if (loading || !userLatitude || !userLongitude) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Erro ao carregar mapa</Text>
      </View>
    );
  }

  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={{ flex: 1, width: "100%", height: "100%", borderRadius: 16 }}
      tintColor="black"
      showsPointsOfInterest={false}
      initialRegion={region}
      showsUserLocation={false}
      userInterfaceStyle="light"
    >
      {/* Ícone de pessoa na posição do usuário */}
      {userLatitude && userLongitude && (
        <Marker
          key="user"
          coordinate={{ latitude: userLatitude, longitude: userLongitude }}
          title="Você"
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 20,
              backgroundColor: "#0286FF",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: "#fff",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Image
              source={icons.person}
              style={{ width: 24, height: 24, tintColor: "#fff" }}
              resizeMode="contain"
            />
          </View>
        </Marker>
      )}

      {/* Markers dos motoristas */}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.title}
          image={
            selectedDriver === marker.id ? icons.selectedMarker : icons.marker
          }
        />
      ))}

      {/* Linhas e destino — apenas nas telas de corrida */}
      {showRoutes && (
        <>
          {/* Linha azul: motorista selecionado → usuário */}
          {driverRoute.length >= 2 && (
            <Polyline
              coordinates={driverRoute}
              strokeColor="#0286FF"
              strokeWidth={4}
            />
          )}

          {/* Marker do destino */}
          {destinationLatitude && destinationLongitude && (
            <Marker
              key="destination"
              coordinate={{
                latitude: destinationLatitude,
                longitude: destinationLongitude,
              }}
              title="Destino"
              image={icons.pin}
            />
          )}

          {/* Linha laranja: usuário → destino */}
          {destinationRoute.length >= 2 && (
            <Polyline
              coordinates={destinationRoute}
              strokeColor="#FF6B00"
              strokeWidth={4}
            />
          )}
        </>
      )}
    </MapView>
  );
};

export default Map;
