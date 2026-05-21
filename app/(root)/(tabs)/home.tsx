import GoogleTextInput from "@/components/GoogleTextInput";
import Map from "@/components/Map";
import RideCard from "@/components/RideCard";
import { icons, images } from "@/constants";
import { useFetch } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { useUser } from "@clerk/expo";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Page() {
  const { setUserLocation, setDestinationLocation } = useLocationStore();
  const { user } = useUser();
  const [hasPermissions, setHasPermissions] = useState(false);
  const { data: recentRides, loading } = useFetch(`/(api)/ride/${user?.id}`);

  const handleSignOut = () => {};
  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation(location);

    router.push("/(root)/find-ride");
  };

  useEffect(() => {
    const requestLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setHasPermissions(false);
        return;
      }

      setHasPermissions(true);

      const location = await Location.getCurrentPositionAsync();

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: `${address[0]?.name ?? ""}, ${address[0]?.region ?? ""}`,
      });
    };

    requestLocation();
  }, []);

  return (
    <SafeAreaView className="bg-general-500 flex-1">
      {/* Header fixo fora do FlatList para o dropdown funcionar sem clipping */}
      <View className="px-4">
        <View className="flex flex-row items-center justify-between my-5">
          <Text className="text-xl capitalize font-JakartaExtraBold">
            Bem-Vindo{" "}
            {user?.firstName ||
              user?.emailAddresses?.[0]?.emailAddress.split("@")[0]}{" "}
            !
          </Text>
          <TouchableOpacity
            onPress={handleSignOut}
            className="justify-center items-center w-10 h-10"
          >
            <Image source={icons.out} className="w-5 h-5" />
          </TouchableOpacity>
        </View>

        {/* Input fora do FlatList — dropdown não sofre clipping */}
        <GoogleTextInput
          icon={icons.search}
          containerStyle="bg-white shadow-md shadow-neutral-500 rounded-full"
          handlePress={handleDestinationPress}
        />
      </View>

      <FlatList
        data={recentRides?.slice(0, 5)}
        renderItem={({ item }) => <RideCard ride={item} />}
        keyExtractor={(item) => item.ride_id}
        className="px-4"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center">
            {!loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  alt="Nenhum registro encontrado"
                  resizeMode="contain"
                />
                <Text className="text-sm">Nenhum registro encontrado</Text>
              </>
            ) : (
              <ActivityIndicator size="small" color="#000000" />
            )}
          </View>
        )}
        ListHeaderComponent={() => (
          <>
            <Text className="text-xl font-JakartaBold mt-5 mb-3">
              Sua localização atual
            </Text>
            <View className="h-[300px] w-full bg-transparent mb-3">
              <Map />
            </View>
            <Text className="text-xl font-JakartaBold mt-5 mb-3">
              Corridas recentes
            </Text>
          </>
        )}
      />
    </SafeAreaView>
  );
}
