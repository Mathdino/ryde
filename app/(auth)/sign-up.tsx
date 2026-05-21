import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { fetchAPI, getServerUrl } from "@/lib/fetch";
import { useAuth } from "@clerk/expo";
import { useLoadingStore } from "@/store";
import { useSignUp } from "@clerk/expo/legacy";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import ReactNativeModal from "react-native-modal";

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const auth = useAuth();
  const { setLoading } = useLoadingStore();
  React.useEffect(() => {
    console.log(
      "[SignUp] mount. useSignUp =",
      { isLoaded, hasSignUp: !!signUp },
      "useAuth =",
      { isLoaded: auth.isLoaded, isSignedIn: auth.isSignedIn },
    );
  }, [isLoaded, signUp, auth.isLoaded, auth.isSignedIn]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const onSignUpPress = async () => {
    console.log(
      "[SignUp] Botão clicado. isLoaded =",
      isLoaded,
      "hasSignUp =",
      !!signUp,
    );
    if (!signUp) {
      Alert.alert(
        "Aguarde",
        "Clerk ainda está carregando. Tente de novo em 1s.",
      );
      return;
    }
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      console.log("[SignUp] prepare OK. Abrindo modal.");
      setVerification({ ...verification, state: "pending" });
    } catch (err: any) {
      console.log("[SignUp] ERRO:", JSON.stringify(err, null, 2));
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        "Erro desconhecido ao criar conta";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };
  const onPressVerify = async () => {
    if (!signUp) return;
    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });
      if (completeSignUp.status === "complete") {
        await fetchAPI(`${getServerUrl()}(api)/user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            clerkId: completeSignUp.createdUserId,
          }),
        });
        await setActive({ session: completeSignUp.createdSessionId });
        setVerification({
          ...verification,
          state: "success",
        });
      } else {
        setVerification({
          ...verification,
          error: "Verificação Falhou. Tente Novamente.",
          state: "failed",
        });
      }
    } catch (err: any) {
      setVerification({
        ...verification,
        error: err.errors[0].longMessage,
        state: "failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 w-full h-[250px]" />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Crie sua conta
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Nome"
            placeholder="Digite seu nome"
            icon={icons.person}
            value={form.name}
            onChangeText={(text) =>
              setForm({
                ...form,
                name: text,
              })
            }
          />

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
            title="Cadastrar"
            onPress={onSignUpPress}
            className="mt-6"
          />

          <OAuth />

          <Link className="text-lg text-center mt-5 mb-8" href="/sign-in">
            <Text className="text-general-200">Já tem uma conta? </Text>
            <Text className="text-primary-500">Faça login</Text>
          </Link>
        </View>

        {/* Verificação */}

        <ReactNativeModal
          isVisible={verification.state === "pending"}
          onModalHide={() => {
            if (verification.state === "success") setShowSuccessModal(true);
          }}
        >
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Text className="text-2xl font-JakartaExtraBold mb-2">
              Verificação
            </Text>
            <Text className="font-Jakarta mb-5">
              Nós enviamos um código de verificação para {form.email}
            </Text>
            <InputField
              label="Code"
              icon={icons.lock}
              placeholder="12345"
              value={verification.code}
              keyboardType="numeric"
              onChangeText={(code) =>
                setVerification({ ...verification, code })
              }
            />

            {verification.error && (
              <Text className="text-red-500 font-Jakarta text-sm mt-1">
                {verification.error}
              </Text>
            )}

            <CustomButton
              title="Verificar Email"
              onPress={onPressVerify}
              className="mt-5 bg-success-500"
            />
          </View>
        </ReactNativeModal>

        <ReactNativeModal isVisible={showSuccessModal}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Image
              source={images.check}
              className="w-[110px] h-[110px] mx-auto my-5"
            />

            <Text className="text-3xl font-JakartaBold text-center">
              Verificação
            </Text>

            <Text className="text-base text-gray-400 font-Jakarta text-center mt-4">
              Sua conta foi verificada com sucesso !
            </Text>

            <CustomButton
              title="Ir para home"
              onPress={() => {
                setShowSuccessModal(false);
                router.push("/(root)/(tabs)/home");
              }}
              className="mt-5"
            />
          </View>
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
};

export default SignUp;
