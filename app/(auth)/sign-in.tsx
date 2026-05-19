import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

const SignIn = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onSignInPress = async () => {
    if (!form.email || !form.password) {
      return;
    }
  };

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
