import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { useSignIn } from "@clerk/expo/legacy";
import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onSignInPress = useCallback(async () => {
    if (!signIn) {
      Alert.alert(
        "Aguarde",
        "Clerk ainda está carregando. Tente de novo em 1s.",
      );
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(root)/(tabs)/home");
      } else {
        // See https://clerk.com/docs/custom-flows/error-handling for more info on error handling
        console.log(JSON.stringify(signInAttempt, null, 2));
        Alert.alert("Error", "Log in failed. Please try again.");
      }
    } catch (err: any) {
      console.log("[SignIn] ERRO:", JSON.stringify(err, null, 2));
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        "Erro desconhecido ao entrar";
      Alert.alert("Error", message);
    }
  }, [signIn, setActive, form]);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 w-full h-[250px]" />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Bem-Vindo !
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Email"
            placeholder="Digite seu email"
            icon={icons.email}
            value={form.email}
            onChangeText={(text) =>
              setForm({
                ...form,
                email: text,
              })
            }
          />

          <InputField
            label="Senha"
            placeholder="Digite seu senha"
            icon={icons.lock}
            value={form.password}
            secureTextEntry={true}
            onChangeText={(text) =>
              setForm({
                ...form,
                password: text,
              })
            }
          />

          <CustomButton
            title="Entrar"
            onPress={onSignInPress}
            className="mt-6"
          />

          <OAuth />

          <Link className="text-lg text-center mt-5 mb-8" href="/sign-up">
            <Text className="text-general-200">Não tem uma conta? </Text>
            <Text className="text-primary-500">Crie agora</Text>
          </Link>
        </View>

        {/* Verificação */}
      </View>
    </ScrollView>
  );
};

export default SignIn;
