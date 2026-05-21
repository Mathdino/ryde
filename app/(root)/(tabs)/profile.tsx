import { useAuth, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { fetchAPI } from "@/lib/fetch";

const maskPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return numbers
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
};

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Busca dados do banco ao montar
  useEffect(() => {
    if (!user?.id) return;

    const loadUser = async () => {
      try {
        const result = await fetchAPI(`/(api)/user?clerk_id=${user.id}`);
        const dbUser = result.data;

        setFirstName(dbUser?.first_name ?? user.firstName ?? "");
        setLastName(dbUser?.last_name ?? user.lastName ?? "");
        setPhone(dbUser?.phone ?? user.primaryPhoneNumber?.phoneNumber ?? "");
      } catch {
        // fallback para dados do Clerk
        setFirstName(user.firstName ?? "");
        setLastName(user.lastName ?? "");
        setPhone(user.primaryPhoneNumber?.phoneNumber ?? "");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      // Salva no banco de dados
      await fetchAPI("/(api)/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          firstName,
          lastName,
          phone,
        }),
      });

      // Atualiza no Clerk também
      await user.update({ firstName, lastName });

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text className="text-2xl font-JakartaBold my-5">Meu Perfil</Text>

        {/* Avatar */}
        <View className="flex items-center justify-center my-5">
          <Image
            source={{
              uri: user?.externalAccounts[0]?.imageUrl ?? user?.imageUrl,
            }}
            style={{ width: 110, height: 110, borderRadius: 55 }}
            className="border-[3px] border-white shadow-sm shadow-neutral-300"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0286FF" className="mt-10" />
        ) : (
          <View className="flex flex-col items-start justify-center bg-white rounded-lg shadow-sm shadow-neutral-300 px-5 py-3">
            <InputField
              label="Primeiro Nome"
              value={firstName}
              onChangeText={setFirstName}
              containerStyle="w-full"
              inputStyle="p-3.5"
            />

            <InputField
              label="Sobrenome"
              value={lastName}
              onChangeText={setLastName}
              containerStyle="w-full"
              inputStyle="p-3.5"
            />

            <InputField
              label="E-mail"
              value={user?.primaryEmailAddress?.emailAddress ?? ""}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={false}
            />

            <InputField
              label="Telefone"
              value={phone}
              onChangeText={(text) => setPhone(maskPhone(text))}
              keyboardType="phone-pad"
              placeholder="(00) 00000-0000"
              maxLength={15}
              containerStyle="w-full"
              inputStyle="p-3.5"
            />

            <CustomButton
              title={saving ? "Salvando..." : "Salvar alterações"}
              onPress={handleSave}
              disabled={saving}
              className="mt-5 w-full"
            />
          </View>
        )}

        {/* Botão de sair */}
        <CustomButton
          title="Sair da conta"
          onPress={handleSignOut}
          bgVariant="danger"
          className="mt-6 w-full"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
