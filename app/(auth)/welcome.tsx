import CustomButton from "@/components/CustomButton";
import { onboarding } from "@/constants";
import { ResizeMode, Video } from "expo-av";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";

const OnboardingSlide = ({
  item,
  isActive,
}: {
  item: (typeof onboarding)[0];
  isActive: boolean;
}) => {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.playAsync();
    } else {
      videoRef.current.pauseAsync();
    }
  }, [isActive]);

  return (
    <View className="flex items-center justify-center p-5">
      <Video
        ref={videoRef}
        source={item.video}
        style={{ width: "100%", height: 300 }}
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        isMuted
        shouldPlay={isActive}
      />
      <View className="flex flex-row items-center justify-center w-full mt-10 mb-2">
        <Text className="text-white text-3xl font-JakartaBold text-center">
          {item.title}
        </Text>
      </View>
      <Text className="text-lg font-JakartaSemiBold text-center text-[#858585] mx-5 mt-3">
        {item.description}
      </Text>
    </View>
  );
};

const Welcome = () => {
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === onboarding.length - 1;

  return (
    <SafeAreaView className="flex h-full items-center justify-between bg-black">
      <TouchableOpacity
        onPress={() => {
          router.replace("/(auth)/sign-up");
        }}
        className="w-full flex justify-end items-end p-5"
      >
        <Text className="text-white text-md font-JakartaBold">Pular</Text>
      </TouchableOpacity>

      <Swiper
        ref={swiperRef}
        loop={false}
        dot={
          <View className="w-[32px] h-[4px] rounded-full mx-1 bg-[#E2E8F0]" />
        }
        activeDot={
          <View className="w-[32px] h-[4px] rounded-full mx-1 bg-[#0286FF]" />
        }
        onIndexChanged={(index: number) => {
          setActiveIndex(index);
        }}
      >
        {onboarding.map((item, index) => (
          <OnboardingSlide
            key={item.id}
            item={item}
            isActive={index === activeIndex}
          />
        ))}
      </Swiper>

      <CustomButton
        title={isLastSlide ? "Vamos Começar" : "Próximo"}
        onPress={() =>
          isLastSlide
            ? router.replace("/(auth)/sign-up")
            : swiperRef.current?.scrollBy(1)
        }
        className="w-10/12 mt-8"
      />
    </SafeAreaView>
  );
};

export default Welcome;
