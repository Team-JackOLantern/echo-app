import { View, Pressable, Animated, Easing } from "react-native";
import { useRef, useState } from "react";
import OffIcon from "@/assets/icons/off";
import Off from "@/assets/icons/off";

const Home = () => {
    const [isOn, setIsOn] = useState(false);

    const outerAnim = useRef(new Animated.Value(0)).current;
    const middleAnim = useRef(new Animated.Value(0)).current;
    const iconColorAnim = useRef(new Animated.Value(0)).current;

    const handlePress = () => {
        const toValue = isOn ? 0 : 1;
        setIsOn((prev) => !prev);

        Animated.parallel([
            Animated.timing(outerAnim, {
                toValue,
                duration: 300,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: false,
            }),
            Animated.timing(middleAnim, {
                toValue,
                duration: 300,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: false,
            }),
            Animated.timing(iconColorAnim, {
                toValue,
                duration: 300,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: false,
            }),
        ]).start();
    };

    const outerBg = outerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#2C2C2C", "#845125"],
    });

    const middleBg = middleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#6D6D6D", "#FF7F11"],
    });

    const iconColor = iconColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#696969", "#FF7F11"],
    });

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#121212",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Pressable onPress={handlePress}>
                <Animated.View
                    style={{
                        width: 250,
                        height: 250,
                        borderRadius: 9999,
                        backgroundColor: outerBg,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Animated.View
                        style={{
                            width: 210,
                            height: 210,
                            borderRadius: 9999,
                            backgroundColor: middleBg,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <View
                            style={{
                                width: 175,
                                height: 175,
                                borderRadius: 9999,
                                backgroundColor: "#EDEDED",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <OffIcon fill={isOn ? "#FF7F11" : "#696969"} />
                        </View>
                    </Animated.View>
                </Animated.View>
            </Pressable>
        </View>
    );
};

export default Home;