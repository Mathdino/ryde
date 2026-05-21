import { useLoadingStore } from "@/store";
import { Image } from "expo-image";
import { useEffect } from "react";
import { Modal, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const LoadingOverlay = () => {
  const { isLoading } = useLoadingStore();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isLoading) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1200, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [isLoading]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!isLoading) return null;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      {/* Fundo levemente embaçado */}
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(255, 255, 255, 0.78)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View style={animatedStyle}>
          <Image
            source={require("@/assets/images/loading-map.svg")}
            style={{ width: 130, height: 130 }}
            contentFit="contain"
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

export default LoadingOverlay;
