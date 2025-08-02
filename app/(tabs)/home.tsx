import { View, Pressable, Animated, Easing, StyleSheet } from "react-native";
import { useRef, useState, useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OffIcon from "@/assets/icons/off";
import MetricsCard from "@/components/MetricsCard";
import { StatusBar } from "expo-status-bar";

interface Ripple {
  id: number;
  scale: Animated.Value;
  opacity: Animated.Value;
}

const Home = () => {
  const [isOn, setIsOn] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const insets = useSafeAreaInsets();

  const buttonScale = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(1)).current;
  const outerColorAnim = useRef(new Animated.Value(0)).current;
  const middleColorAnim = useRef(new Animated.Value(0)).current;

  const createRipple = useCallback(() => {
    const id = Date.now() + Math.random();
    const scale = new Animated.Value(0);
    const opacity = new Animated.Value(0.4);

    const newRipple: Ripple = { id, scale, opacity };

    setRipples((prev) => [...prev, newRipple]);

    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    });
  }, []);

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 0.96,
        useNativeDriver: false,
        tension: 300,
        friction: 8,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0.4,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  }, [buttonScale, shadowAnim]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: false,
        tension: 200,
        friction: 7,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  }, [buttonScale, shadowAnim]);

  const handlePress = useCallback(() => {
    const newIsOn = !isOn;
    const toValue = newIsOn ? 1 : 0;

    setIsOn(newIsOn);
    createRipple();

    Animated.parallel([
      Animated.timing(outerColorAnim, {
        toValue,
        duration: 350,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(middleColorAnim, {
        toValue,
        duration: 350,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start();
  }, [isOn, createRipple, outerColorAnim, middleColorAnim]);

  const interpolatedValues = useMemo(
    () => ({
      outerBg: outerColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#2C2C2C", "#845125"],
      }),
      middleBg: middleColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#6D6D6D", "#FF7F11"],
      }),
      shadowOpacity: shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.2, 0.45],
      }),
      shadowRadius: shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [12, 20],
      }),
      shadowOffset: shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [4, 10],
      }),
    }),
    [outerColorAnim, middleColorAnim, shadowAnim]
  );

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.buttonSection}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            accessible={true}
            accessibilityLabel={`Power button, currently ${
              isOn ? "on" : "off"
            }`}
            accessibilityRole="button"
          >
            <Animated.View
              style={[
                styles.outerCircle,
                {
                  backgroundColor: interpolatedValues.outerBg,
                  transform: [{ scale: buttonScale }],
                  shadowOpacity: interpolatedValues.shadowOpacity,
                  shadowRadius: interpolatedValues.shadowRadius,
                  shadowOffset: {
                    width: 0,
                    height: interpolatedValues.shadowOffset,
                  },
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.middleCircle,
                  { backgroundColor: interpolatedValues.middleBg },
                ]}
              >
                {ripples.map((ripple) => (
                  <Animated.View
                    key={ripple.id}
                    style={[
                      styles.ripple,
                      {
                        backgroundColor: isOn
                          ? "rgba(255, 255, 255, 0.2)"
                          : "rgba(255, 127, 17, 0.15)",
                        opacity: ripple.opacity,
                        transform: [
                          {
                            scale: ripple.scale.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.3, 1.4],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ))}

                <View style={styles.centerButton}>
                  <View style={styles.centerButtonBackdrop} />
                  <View style={styles.centerButtonHighlight} />
                  <OffIcon fill={isOn ? "#FF7F11" : "#696969"} />
                </View>
              </Animated.View>
            </Animated.View>
          </Pressable>
        </View>

        <View
          style={[styles.metricsWrapper, { paddingBottom: insets.bottom + 20 }]}
        >
          <MetricsCard
            activeTime="68:12"
            vibrationCount={12}
            activeTimePercent={68.2}
            compact={false}
          />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  buttonSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  outerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  middleCircle: {
    width: 210,
    height: 210,
    borderRadius: 105,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  ripple: {
    position: "absolute",
    width: 175,
    height: 175,
    borderRadius: 87.5,
  },
  centerButton: {
    width: 175,
    height: 175,
    borderRadius: 87.5,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  centerButtonBackdrop: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 87.5,
  },
  centerButtonHighlight: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 87.5,
  },
  metricsWrapper: {
    paddingHorizontal: 20,
  },
});

export default Home;
