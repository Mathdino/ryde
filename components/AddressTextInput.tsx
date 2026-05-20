import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const AddressTextInput = ({
  icon,
  containerStyle,
  handlePress,
  initialLocation,
  textInputBackgroundColor,
}: GoogleInputProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const bgColor = textInputBackgroundColor ?? "white";

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const buscarEnderecos = useCallback(async (texto: string) => {
    if (texto.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texto)}&format=json&addressdetails=1&limit=6`,
        {
          headers: {
            "Accept-Language": "pt-BR,pt;q=0.9",
            "User-Agent": "RydeApp/1.0",
          },
        }
      );
      const data: NominatimResult[] = await res.json();
      if (!isMounted.current) return;
      setResults(data);
    } catch (e) {
      console.warn("[AddressTextInput] Erro Nominatim:", e);
      if (isMounted.current) setResults([]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscarEnderecos(query), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, buscarEnderecos]);

  const selecionarEndereco = (item: NominatimResult) => {
    setResults([]);
    setQuery(item.display_name);
    Keyboard.dismiss();
    handlePress({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      address: item.display_name,
    });
  };

  const handleSubmitEditing = () => {
    if (results.length > 0) selecionarEndereco(results[0]);
  };

  return (
    <View style={{ zIndex: 50 }} className={`mb-5 ${containerStyle}`}>
      {/* Campo de input */}
      <View
        className="flex flex-row items-center rounded-full px-4 mx-5"
        style={{ backgroundColor: bgColor }}
      >
        <Image
          source={icon ?? icons.search}
          className="w-6 h-6 mr-2"
          resizeMode="contain"
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={initialLocation ?? "Para onde gostaria de ir?"}
          placeholderTextColor="gray"
          returnKeyType="search"
          onSubmitEditing={handleSubmitEditing}
          className="flex-1 py-3 text-base font-semibold"
          style={{ color: "#000" }}
        />
        {loading && (
          <ActivityIndicator size="small" color="#888" className="ml-2" />
        )}
      </View>

      {/* Dropdown — position absolute, funciona pois está fora do FlatList */}
      {results.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: 52,
            left: 20,
            right: 20,
            backgroundColor: bgColor,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 10,
            zIndex: 100,
            maxHeight: 260,
            overflow: "hidden",
          }}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.place_id)}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={results.length > 4}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => selecionarEndereco(item)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: index < results.length - 1 ? 1 : 0,
                  borderBottomColor: "#f0f0f0",
                }}
              >
                <Text style={{ fontSize: 14, color: "#333" }} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default AddressTextInput;
