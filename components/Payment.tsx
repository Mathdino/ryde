import { useAuth } from "@clerk/expo";
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";
import { fetchAPI, getServerUrl } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { PaymentProps } from "@/types/type";

const Payment = ({
  fullName,
  email,
  amount,
  driverId,
  rideTime,
}: PaymentProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const {
    userAddress,
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationAddress,
    destinationLongitude,
  } = useLocationStore();

  const { userId } = useAuth();
  const [success, setSuccess] = useState(false);

  const openPaymentSheet = async () => {
    // 1. Cria o PaymentIntent no servidor e inicializa o sheet
    const clientSecret = await initializePaymentSheet();
    if (!clientSecret) return;

    // 2. Abre o sheet para o usuário preencher os dados do cartão
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Erro no pagamento: ${error.code}`, error.message);
      return;
    }

    // 3. Pagamento confirmado — salva a corrida no banco
    try {
      await fetchAPI(`${getServerUrl()}(api)/ride/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_address: userAddress,
          destination_address: destinationAddress,
          origin_latitude: userLatitude,
          origin_longitude: userLongitude,
          destination_latitude: destinationLatitude,
          destination_longitude: destinationLongitude,
          ride_time: rideTime.toFixed(0),
          fare_price: Math.round(parseFloat(amount) * 100),
          payment_status: "Pago",
          driver_id: driverId,
          user_id: userId,
        }),
      });
    } catch (dbError) {
      console.error("Erro ao salvar corrida:", dbError);
    }

    setSuccess(true);
  };

  // Cria o PaymentIntent no servidor e devolve o client_secret
  const initializePaymentSheet = async (): Promise<string | null> => {
    try {
      const response = await fetchAPI(`${getServerUrl()}(api)/(stripe)/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName || email.split("@")[0],
          email,
          amount,
        }),
      });

      const clientSecret = response?.paymentIntent?.client_secret;

      if (!clientSecret) {
        Alert.alert("Erro", "Não foi possível iniciar o pagamento.");
        return null;
      }

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Ryde",
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: { name: fullName, email },
        returnURL: "ryde://book-ride",
      });

      if (error) {
        Alert.alert("Erro ao carregar pagamento", error.message);
        return null;
      }

      return clientSecret;
    } catch (err: any) {
      const msg = err?.message ?? "Falha ao conectar ao servidor de pagamento.";
      console.error("[Payment] initializePaymentSheet erro:", msg);
      Alert.alert("Erro ao iniciar pagamento", msg);
      return null;
    }
  };

  return (
    <>
      <CustomButton
        title="Confirmar Corrida"
        className="my-10"
        onPress={openPaymentSheet}
      />

      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => setSuccess(false)}
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={images.check} className="w-28 h-28 mt-5" />

          <Text className="text-2xl text-center font-JakartaBold mt-5">
            Corrida confirmada!
          </Text>

          <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
            Obrigado por usar a Ryde!
          </Text>

          <CustomButton
            title="Voltar para home"
            onPress={() => {
              setSuccess(false);
              router.replace("/(root)/(tabs)/home");
            }}
            className="mt-5"
          />
        </View>
      </ReactNativeModal>
    </>
  );
};

export default Payment;
