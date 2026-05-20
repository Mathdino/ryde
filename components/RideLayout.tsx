import Map from "@/components/Map";
import { icons } from "@/constants";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const RideLayout = ({
  children,
  title,
  snapPoints,
}: {
  children: React.ReactNode;
  title: string;
  snapPoints: string[];
}) => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  return (
    <GestureHandlerRootView style={{ flex: 1, marginBottom: 8 }}>
      <View className="flex-1 bg-white">
        <View className="flex-1">
          <View className="flex flex-row absolute z-10 top-16 items-center justify-start px-5">
            <TouchableOpacity onPress={() => router.back()}>
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                <Image
                  source={icons.backArrow}
                  resizeMode="contain"
                  className="h-6 w-6"
                />
              </View>
            </TouchableOpacity>
            <Text className="text-xl font-JakartaSemiBold ml-5">
              {title || "Voltar"}
            </Text>
          </View>
          <Map showRoutes />
        </View>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints || ["40%", "85%"]}
          index={0}
        >
          <BottomSheetView style={{ flex: 1, padding: 20 }}>
            {children}
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

export default RideLayout;
