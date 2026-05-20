import RideLayout from "@/components/RideLayout";
import { useLocationStore } from "@/store";
import React from "react";
import { View } from "react-native";

const FindRide = () => {
  const {
    userAddress,
    destinationAddress,
    setDestinationLocation,
    setUserLocation,
  } = useLocationStore();
  return (
    <RideLayout title="Corrida">
      <View className="my-3"></View>
    </RideLayout>
  );
};

export default FindRide;
