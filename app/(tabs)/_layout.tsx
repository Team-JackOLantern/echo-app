import { Tabs } from "expo-router";
import { Animated, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useEffect, useCallback } from "react";
import HomeIcon from "@/assets/icons/home";
import StatisticsIcon from "@/assets/icons/statistics";
import GroupIcon from "@/assets/icons/group";

interface TabIconProps {
  name: string;
  color: string;
  focused: boolean;
}

function TabIcon({ name, color, focused }: TabIconProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.08 : 1,
        useNativeDriver: true,
        tension: 400,
        friction: 12,
      }),
      Animated.spring(translateYAnim, {
        toValue: focused ? -1 : 0,
        useNativeDriver: true,
        tension: 400,
        friction: 12,
      }),
    ]).start();
  }, [focused, scaleAnim, translateYAnim]);

  const getIconComponent = useCallback(() => {
    switch (name) {
      case "home":
        return HomeIcon;
      case "statistics":
        return StatisticsIcon;
      case "group":
        return GroupIcon;
      default:
        return HomeIcon;
    }
  }, [name]);

  const IconComponent = getIconComponent();

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        }}
      >
        <IconComponent fill={color} />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF7F11",
        tabBarInactiveTintColor: "#4A4A4A",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: "PretendardMedium",
          fontSize: 10,
          fontWeight: "500",
          marginTop: 4,
          letterSpacing: -0.1,
        },
        tabBarStyle: {
          backgroundColor: "#0F0F0F",
          paddingTop: 8,
          paddingBottom:
            Platform.OS === "android" ? 24 : Math.max(insets.bottom, 8),
          paddingHorizontal: 16,
          height:
            Platform.OS === "android" ? 80 : Math.max(insets.bottom + 64, 72),
          borderTopWidth: 0,
          borderTopColor: "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowColor: "transparent",
          elevation: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          paddingVertical: 4,
          paddingHorizontal: 6,
          minHeight: 44,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarAllowFontScaling: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="statistics"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="statistics" color={color} focused={focused} />
          ),
          tabBarLabel: "통계",
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
          tabBarLabel: "홈",
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="group" color={color} focused={focused} />
          ),
          tabBarLabel: "그룹",
        }}
      />
        <Tabs.Screen
            name="create"
            options={{
                href: null
            }}
        />
    </Tabs>
  );
}
