import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { googleOAuth } from "@/lib/auth";
import { useLoadingStore } from "@/store";
import { useOAuth } from "@clerk/expo";
import { router } from "expo-router";
import React from "react";
import { Alert, Image, Text, View } from "react-native";

const OAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { setLoading } = useLoadingStore();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await googleOAuth(startOAuthFlow);

      if (result.code === "session_exists") {
        Alert.alert(
          "Success",
          "Sua sessão já existe. Redirecionando para a tela inicial.",
        );
        router.replace("/(root)/(tabs)/home");
        return;
      }

      Alert.alert(result.success ? "Success" : "Error", result.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[1px] bg-general-100" />
        <Text className="text-lg">Ou</Text>
        <View className="flex-1 h-[1px] bg-general-100" />
      </View>

      <CustomButton
        title="Entrar com Google"
        className="mt-5 w-full shadow-none"
        IconLeft={() => (
          <Image
            source={icons.google}
            className="w-5 h-5 mx-2"
            resizeMode="contain"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={handleGoogleSignIn}
      />
    </View>
  );
};

export default OAuth;
