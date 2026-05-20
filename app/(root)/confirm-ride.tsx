import CustomButton from "@/components/CustomButton";
import DriverCard from "@/components/DriverCard";
import RideLayout from "@/components/RideLayout";
import { useDriverStore } from "@/store";
import { router } from "expo-router";
import React from "react";
import { FlatList, View } from "react-native";

const ConfirmRide = () => {
  const { selectedDriver, drivers, setSelectedDriver } = useDriverStore();
  return (
    <RideLayout title="Escolha um motorista" snapPoints={["65%", "85%"]}>
      <FlatList
        data={drivers}
        renderItem={({ item }) => (
          <DriverCard
            selected={selectedDriver!}
            setSelected={() => setSelectedDriver(item.id!)}
            item={item}
          />
        )}
        ListFooterComponent={() => (
          <View className="mx-5 mt-10">
            <CustomButton
              title="Selecione o motorista"
              onPress={() => router.push("/(root)/book-ride")}
            />
          </View>
        )}
      />
    </RideLayout>
  );
};

export default ConfirmRide;
