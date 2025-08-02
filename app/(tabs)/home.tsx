import { View, Pressable, Animated, Easing, StyleSheet } from "react-native";
import { useRef, useState } from "react";
import OffIcon from "@/assets/icons/off";

const Home = () => {
    const [isOn, setIsOn] = useState(false);
    const [ripples, setRipples] = useState([]);

    const buttonScale = useRef(new Animated.Value(1)).current;
    const shadowAnim = useRef(new Animated.Value(1)).current;
    const outerColorAnim = useRef(new Animated.Value(0)).current;
    const middleColorAnim = useRef(new Animated.Value(0)).current;

    const createRipple = () => {
        const id = Date.now();
        const scale = new Animated.Value(0);
        const opacity = new Animated.Value(0.5);

        setRipples(prev => [...prev, { id, scale, opacity }]);

        Animated.parallel([
            Animated.timing(scale, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 600,
                useNativeDriver: false,
            }),
        ]).start(() => {
            setRipples(prev => prev.filter(ripple => ripple.id !== id));
        });
    };

    const handlePressIn = () => {
        Animated.parallel([
            Animated.timing(buttonScale, {
                toValue: 0.95,
                duration: 120,
                useNativeDriver: false,
            }),
            Animated.timing(shadowAnim, {
                toValue: 0.3,
                duration: 120,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.timing(buttonScale, {
                toValue: 1,
                duration: 200,
                easing: Easing.out(Easing.back(1.05)),
                useNativeDriver: false,
            }),
            Animated.timing(shadowAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const handlePress = () => {
        const toValue = isOn ? 0 : 1;
        setIsOn(!isOn);
        createRipple();

        Animated.parallel([
            Animated.timing(outerColorAnim, {
                toValue,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.timing(middleColorAnim, {
                toValue,
                duration: 300,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const outerBg = outerColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#2C2C2C", "#845125"],
    });

    const middleBg = middleColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#6D6D6D", "#FF7F11"],
    });

    const shadowOpacity = shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.15, 0.4],
    });

    const shadowRadius = shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [8, 16],
    });

    const shadowOffset = shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [3, 8],
    });

    return (
        <View style={styles.container}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
            >
                <Animated.View
                    style={[
                        styles.outerCircle,
                        {
                            backgroundColor: outerBg,
                            transform: [{ scale: buttonScale }],
                            shadowOpacity,
                            shadowRadius,
                            shadowOffset: {
                                width: 0,
                                height: shadowOffset
                            },
                        }
                    ]}
                >
                    <View style={styles.innerShadow} />
                    <View style={styles.highlight} />

                    <Animated.View
                        style={[
                            styles.middleCircle,
                            { backgroundColor: middleBg }
                        ]}
                    >
                        {ripples.map(ripple => (
                            <Animated.View
                                key={ripple.id}
                                style={[
                                    styles.ripple,
                                    {
                                        backgroundColor: isOn ? "#FF7F11" : "#696969",
                                        opacity: ripple.opacity,
                                        transform: [{
                                            scale: ripple.scale.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.2, 1.6]
                                            })
                                        }]
                                    }
                                ]}
                            />
                        ))}

                        <View style={styles.centerButton}>
                            <OffIcon fill={isOn ? "#FF7F11" : "#696969"} />
                        </View>
                    </Animated.View>
                </Animated.View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
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
        elevation: 12,
        overflow: "hidden",
        position: "relative",
    },
    innerShadow: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 125,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        backgroundColor: "transparent",
    },
    highlight: {
        position: "absolute",
        top: 8,
        left: 8,
        right: 8,
        bottom: 8,
        borderRadius: 117,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        backgroundColor: "transparent",
    },
    middleCircle: {
        width: 210,
        height: 210,
        borderRadius: 105,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
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
        backgroundColor: "#EDEDED",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 1,
    },
});

export default Home;