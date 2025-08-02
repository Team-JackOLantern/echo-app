import { useEffect, useRef, useState } from "react";
import {
    Text,
    View,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from "react-native";

const TABS = ["오늘", "이번 주", "이번 달"];
const SCREEN_WIDTH = Dimensions.get("window").width;

const Statistics = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 전체 탭 영역 너비 (패딩 제외)
        const totalWidth = SCREEN_WIDTH * 0.9 - 8;
        const tabWidth = totalWidth / 3;
        const highlightWidth = tabWidth - 8; // 하이라이트는 각 탭보다 8px 작게
        const highlightStartX = 6; // 첫 번째 하이라이트 시작 위치

        // 각 탭의 하이라이트 위치 계산
        const positions = [
            highlightStartX, // 첫 번째 탭
            highlightStartX + tabWidth, // 두 번째 탭
            highlightStartX + tabWidth * 2 // 세 번째 탭
        ];

        Animated.timing(translateX, {
            toValue: positions[selectedIndex] - highlightStartX,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [selectedIndex]);

    return (
        <View style={styles.container}>
            {/* 프로필쪽 */}
            <View style={styles.profileSection}>
                <View style={styles.profileImage} />
                <View style={styles.profileTextContainer}>
                    <View style={styles.greetingContainer}>
                        <Text style={styles.nameText}>이재환 </Text>
                        <Text style={styles.nimText}>님 </Text>
                        <Text style={styles.greetingText}>안녕하세요.</Text>
                    </View>
                    <Text style={styles.subText}>뭔가 쓰고싶은 말 써야할지...</Text>
                </View>
            </View>

            {/* 탭 버튼들 */}
            <View style={styles.tabWrapper}>
                <View style={styles.tabContainer}>
                    <Animated.View
                        style={[
                            styles.activeTabHighlight,
                            {
                                transform: [{ translateX }],
                            },
                        ]}
                    />
                    {TABS.map((tab, i) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setSelectedIndex(i)}
                            style={styles.tabButton}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    selectedIndex === i && styles.activeTabText,
                                ]}
                            >
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    {/* 구분선들 */}
                    <View style={styles.divider1} />
                    <View style={styles.divider2} />
                </View>
            </View>

            {/* 차트 영역 */}
            <View style={styles.chartContainer}>
                <View style={styles.mountain1} />
                <View style={styles.mountain2} />
                <View style={styles.currentPosition} />
            </View>

            {/* 하단 버튼 */}
            <View style={styles.bottomButtonContainer}>
                <TouchableOpacity style={styles.instagramButton}>
                    <Text style={styles.instagramButtonText}>
                        인스타그램 스토리 공유하기
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
        alignItems: "center",
        paddingTop: 100,
    },
    profileSection: {
        width: 390,
        alignItems: "center",
        justifyContent: "flex-start",
        flexDirection: "row",
        paddingHorizontal: 18,
        gap: 24,
        marginBottom: 40,
    },
    profileImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#D9D9D9",
    },
    profileTextContainer: {
        width: 190,
        height: 48,
        flexDirection: "column",
        gap: 5,
    },
    greetingContainer: {
        flexDirection: "row",
        alignItems: "baseline",
    },
    nameText: {
        fontSize: 20,
        fontFamily: "PretendardSemiBold",
        color: "#FF7F11",
    },
    nimText: {
        fontSize: 18,
        color: "#FF7F11",
        fontFamily: "PretendardMedium",
    },
    greetingText: {
        fontSize: 18,
        color: "#EAE3EE",
        fontFamily: "PretendardMedium",
    },
    subText: {
        fontSize: 16,
        color: "#878787",
        fontFamily: "PretendardRegular",
    },
    tabWrapper: {
        width: SCREEN_WIDTH * 0.9,
        alignItems: "center",
        marginBottom: 40,
    },
    tabContainer: {
        width: "100%",
        height: 40,
        flexDirection: "row",
        backgroundColor: "#333",
        borderRadius: 12,
        padding: 4,
        position: "relative",
    },
    activeTabHighlight: {
        position: "absolute",
        left: 6,
        top: 4,
        bottom: 4,
        width: (SCREEN_WIDTH * 0.9 - 8) / 3 - 8,
        borderRadius: 8,
        backgroundColor: "#636366",
        zIndex: 0,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
    },
    tabText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#878787",
    },
    activeTabText: {
        color: "#FFFFFF",
    },
    divider1: {
        position: "absolute",
        left: (SCREEN_WIDTH * 0.9 - 8) / 3,
        top: 8,
        bottom: 8,
        width: 1,
        backgroundColor: "#878787",
        zIndex: 2,
    },
    divider2: {
        position: "absolute",
        left: ((SCREEN_WIDTH * 0.9 - 8) / 3) * 2,
        top: 8,
        bottom: 8,
        width: 1,
        backgroundColor: "#878787",
        zIndex: 2,
    },
    chartContainer: {
        width: 350,
        height: 200,
        position: "relative",
        marginBottom: 80,
    },
    mountain1: {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: 200,
        height: 120,
        backgroundColor: "#8B4513",
    },
    mountain2: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 220,
        height: 160,
        backgroundColor: "#A0522D",
        borderTopLeftRadius: 80,
        borderTopRightRadius: 50,
    },
    currentPosition: {
        position: "absolute",
        top: 80,
        left: 80,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#FF7F11",
    },
    bottomButtonContainer: {
        position: "absolute",
        bottom: 100,
        left: 20,
        right: 20,
    },
    instagramButton: {
        backgroundColor: "#FF7F11",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    instagramButtonText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    cameraButtonContainer: {
        position: "absolute",
        bottom: 20,
        left: 20,
    },
    cameraButton: {
        backgroundColor: "#333333",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    cameraButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#FFFFFF",
    },
});

export default Statistics;