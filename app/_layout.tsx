import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { View, Text } from "react-native";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PretendardRegular: require("../assets/fonts/Pretendard-Regular.ttf"),
    PretendardMedium: require("../assets/fonts/Pretendard-Medium.ttf"),
    PretendardSemiBold: require("../assets/fonts/Pretendard-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>폰트 불러오는 중...</Text>
        </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}