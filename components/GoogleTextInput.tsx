import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? "";

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = async (text: string) => {
    if (text.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(text)}` +
        `&key=${GOOGLE_API_KEY}` +
        `&language=pt-BR`;

      const res = await fetch(url);
      const data = await res.json();
      setResults(data.predictions ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaceDetails = async (
    placeId: string,
  ): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${placeId}` +
        `&key=${GOOGLE_API_KEY}` +
        `&fields=geometry`;

      const res = await fetch(url);
      const data = await res.json();
      const location = data.result?.geometry?.location;
      if (!location) return null;
      return { latitude: location.lat, longitude: location.lng };
    } catch {
      return null;
    }
  };

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300);
  };

  const onSelect = async (item: any) => {
    setQuery(item.description);
    setResults([]);

    const coords = await fetchPlaceDetails(item.place_id);
    if (!coords) return;

    handlePress({
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: item.description,
    });
  };

  const bgColor = textInputBackgroundColor ?? "white";

  return (
    <View className={`relative z-50 ${containerStyle}`}>
      {/* Campo de busca */}
      <View
        className="flex flex-row items-center rounded-full px-4 shadow-md shadow-neutral-300"
        style={{ backgroundColor: bgColor, height: 50 }}
      >
        <Image
          source={icon ?? icons.search}
          className="w-6 h-6 mr-3"
          resizeMode="contain"
        />
        <TextInput
          value={query}
          onChangeText={onChangeText}
          placeholder={initialLocation ?? "Para onde você quer ir?"}
          placeholderTextColor="gray"
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: "600",
            color: "#000",
          }}
        />
        {loading && <ActivityIndicator size="small" color="#aaa" />}
      </View>

      {/* Lista de sugestões */}
      {results.length > 0 && (
        <View
          className="absolute left-0 right-0 rounded-2xl overflow-hidden z-50"
          style={{
            top: 55,
            backgroundColor: bgColor,
            elevation: 6,
            shadowColor: "#d4d4d4",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
          }}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: index < results.length - 1 ? 1 : 0,
                  borderBottomColor: "#f0f0f0",
                }}
              >
                <Text
                  numberOfLines={2}
                  style={{ fontSize: 14, color: "#333", fontWeight: "500" }}
                >
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default GoogleTextInput;
