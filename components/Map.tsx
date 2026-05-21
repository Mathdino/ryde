import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Platform, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? "";

const DEFAULT_REGION = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const Map = () => {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  const {
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  const { selectedDriver, setDrivers } = useDriverStore();
  const { data: drivers } = useFetch<Driver[]>("/(api)/driver");
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  // Anima o mapa para a localização do usuário quando disponível
  useEffect(() => {
    if (mapReady && userLatitude && userLongitude) {
      mapRef.current?.animateToRegion(
        {
          latitude: userLatitude,
          longitude: userLongitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        600,
      );
    }
  }, [mapReady, userLatitude, userLongitude]);

  // Gera markers dos motoristas ao redor do usuário
  useEffect(() => {
    if (!Array.isArray(drivers) || !userLatitude || !userLongitude) return;
    const newMarkers = generateMarkersFromData({
      data: drivers,
      userLatitude,
      userLongitude,
    });
    setMarkers(newMarkers);
  }, [drivers, userLatitude, userLongitude]);

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

  const region = calculateRegion({
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  });

  return (
    <View style={{ flex: 1, width: "100%" }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1, width: "100%", borderRadius: 16 }}
        mapType={Platform.OS === "android" ? "standard" : "mutedStandard"}
        showsPointsOfInterest={false}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        userInterfaceStyle="light"
        onMapReady={() => setMapReady(true)}
      >
        {/* Ícone do usuário */}
        {userLatitude && userLongitude && (
          <Marker
            coordinate={{ latitude: userLatitude, longitude: userLongitude }}
            title="Você"
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#0286FF",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: "#fff",
                elevation: 5,
              }}
            >
              <Image
                source={icons.person}
                style={{ width: 18, height: 18, tintColor: "#fff" }}
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
              selectedDriver === +marker.id ? icons.selectedMarker : icons.marker
            }
          />
        ))}

        {/* Rota e marcador de destino */}
        {destinationLatitude && destinationLongitude && (
          <>
            <Marker
              coordinate={{
                latitude: destinationLatitude,
                longitude: destinationLongitude,
              }}
              title="Destino"
              image={icons.pin}
            />
            <MapViewDirections
              origin={{
                latitude: userLatitude!,
                longitude: userLongitude!,
              }}
              destination={{
                latitude: destinationLatitude,
                longitude: destinationLongitude,
              }}
              apikey={GOOGLE_API_KEY}
              strokeColor="#0286FF"
              strokeWidth={3}
            />
          </>
        )}
      </MapView>

      {/* Spinner sobreposto enquanto aguarda localização */}
      {!userLatitude && !userLongitude && (
        <View
          style={{
            position: "absolute",
            top: 10,
            alignSelf: "center",
            backgroundColor: "rgba(255,255,255,0.9)",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 6,
          }}
        >
          <ActivityIndicator size="small" color="#0286FF" />
        </View>
      )}
    </View>
  );
};

export default Map;
