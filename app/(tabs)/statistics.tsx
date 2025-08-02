import React, {useRef, useState, useEffect} from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
} from "react-native";
import {LineChart} from "react-native-chart-kit";
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get("window").width;
const TABS = ["오늘", "이번 주"] as const;
type TabType = typeof TABS[number];

const DATASETS: Record<TabType, number[]> = {
    오늘: [5, 6, 4, 7, 5, 8, 6],
    "이번 주": [20, 45, 28, 80, 99, 43, 50],
};

const WORDS = [
    {word: "시발", count: 24},
    {word: "시발", count: 24},
    {word: "시발", count: 24},
    {word: "시발", count: 24},
    {word: "시발", count: 24},
];

const Statistics = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const translateX = useRef(new Animated.Value(0)).current;
    const tabWidth = (SCREEN_WIDTH * 0.9 - 8) / 2;

    const currentLabel = TABS[selectedIndex];
    const currentData = DATASETS[currentLabel];

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: selectedIndex * tabWidth,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [selectedIndex]);

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
            <View style={styles.profileSection}>
                <View style={styles.profileImage}/>
                <View style={styles.profileTextContainer}>
                    <View style={styles.greetingContainer}>
                        <Text style={styles.nameText}>이재환 </Text>
                        <Text style={styles.nimText}>님 </Text>
                        <Text style={styles.greetingText}>안녕하세요.</Text>
                    </View>
                    <Text style={styles.subText}>뭔가 쓰고싶은 말 써야할지...</Text>
                </View>
            </View>

            <View style={styles.tabWrapper}>
                <View style={styles.tabContainer}>
                    <Animated.View
                        style={[
                            styles.activeTabHighlight,
                            {transform: [{translateX}]},
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
                    <View style={styles.divider1}/>
                </View>
            </View>

            <LineChart
                data={{
                    labels: ["", "", "", "", "", "", ""],
                    datasets: [{data: currentData}],
                }}
                width={SCREEN_WIDTH - 40}
                height={200}
                withDots={false}
                withInnerLines={false}
                withOuterLines={false}
                formatYLabel={(label) => `${parseInt(label)} 회`}
                chartConfig={{
                    backgroundGradientFrom: "#121212",
                    backgroundGradientTo: "#121212",
                    color: () => `#FF7F11`,
                    fillShadowGradientFrom: "#FF7F11",
                    fillShadowGradientTo: "#121212",
                    fillShadowGradientFromOpacity: 0.7,
                }}
                style={styles.chart}
            />

            <View style={styles.bottomSection}>
                <LinearGradient
                    colors={['#121212', '#212121']}
                    start={{x: 0.5, y: 0}}
                    end={{x: 0.5, y: 1}}
                    style={styles.metricsContainer}
                >
                    <View style={styles.metric}>
                        <Text style={styles.metricLabel}>활성화 시간</Text>
                        <Text style={styles.metricValue}>68:12</Text>
                    </View>
                    <View style={styles.metricDivider}/>
                    <View style={styles.metric}>
                        <Text style={styles.metricLabel}>진동 횟수</Text>
                        <Text style={styles.metricCount}>12</Text>
                        <Text style={styles.metricUnit}>회</Text>
                    </View>
                </LinearGradient>

                <View style={styles.wordList}>
                    {WORDS.map((item, index) => (
                        <View key={index} style={styles.wordItem}>
                            <Text style={styles.wordText}>{item.word}</Text>
                            <Text style={styles.wordCount}>{item.count}회</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.instagramButton}>
                    <Text style={styles.instagramButtonText}>인스타그램 스토리 공유하기</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: "#121212",
    },
    contentContainer: {
        alignItems: "center",
        paddingBottom: 40,
    },
    profileSection: {
        width: SCREEN_WIDTH - 20,
        flexDirection: "row",
        paddingHorizontal: 18,
        gap: 24,
        marginTop: 100,
        marginBottom: 40,
    },
    profileImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#D9D9D9",
    },
    profileTextContainer: {
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
        marginBottom: 24,
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
        top: 4,
        bottom: 4,
        left: 0,
        width: (SCREEN_WIDTH * 0.9 - 8) / 2,
        borderRadius: 8,
        backgroundColor: "#636366",
        zIndex: 0,
    },
    tabButton: {
        flex: 1,
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
        left: (SCREEN_WIDTH * 0.9 - 8) / 2,
        top: 8,
        bottom: 8,
        width: 1,
        backgroundColor: "#878787",
        zIndex: 2,
    },
    chart: {
        marginBottom: 32,
    },
    bottomSection: {
        width: SCREEN_WIDTH,
        backgroundColor: "#212121",
        paddingVertical: 24,
        paddingHorizontal: 24,
        gap: 16,
    },
    metricsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    metric: {
        alignItems: "center",
    },
    metricLabel: {
        fontSize: 14,
        color: "#EAE3EE",
    },
    metricValue: {
        fontSize: 16,
        color: "#EAE3EE",
        marginTop: 8,
    },
    metricCount: {
        fontSize: 36,
        color: "#FF7F11",
        fontFamily: "PretendardSemiBold",
    },
    metricUnit: {
        fontSize: 14,
        color: "#EAE3EE",
    },
    metricDivider: {
        height: 60,
        width: 1,
        backgroundColor: "#878787",
    },
    wordList: {
        gap: 8,
    },
    wordItem: {
        backgroundColor: "#121212",
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    wordText: {
        color: "#EAE3EE",
        fontSize: 14,
        fontFamily: "PretendardSemiBold",
    },
    wordCount: {
        color: "#EAE3EE",
        fontSize: 12,
        fontFamily: "PretendardMedium",
    },
    instagramButton: {
        backgroundColor: "#FF7F11",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    instagramButtonText: {
        fontSize: 18,
        fontFamily: "PretendardSemiBold",
        color: "#FFFFFF",
    },
});

export default Statistics;