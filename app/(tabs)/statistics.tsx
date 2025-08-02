import React, { useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
  Share,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import MetricsCard from "@/components/MetricsCard";
import { StatusBar } from "expo-status-bar";

const SCREEN_WIDTH = Dimensions.get("window").width;
const TABS = ["오늘", "이번 주"] as const;
type TabType = (typeof TABS)[number];

const DATASETS: Record<TabType, number[]> = {
  오늘: [5, 8, 12, 15, 18, 22, 16],
  "이번 주": [20, 45, 28, 80, 99, 43, 50],
};

const LABELS: Record<TabType, string[]> = {
  오늘: ["6시", "9시", "12시", "15시", "18시", "21시", "24시"],
  "이번 주": ["월", "화", "수", "목", "금", "토", "일"],
};

const WORDS = [
  { word: "시발", count: 24 },
  { word: "씨발", count: 18 },
  { word: "개새끼", count: 15 },
  { word: "병신", count: 12 },
  { word: "미친", count: 8 },
];

interface CustomChartProps {
  data: number[];
  labels: string[];
  width: number;
  height: number;
}

const CustomChart: React.FC<CustomChartProps> = ({
  data,
  labels,
  width,
  height,
}) => {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const valueRange = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = padding + (index * chartWidth) / (data.length - 1);
    const y =
      padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    return { x, y, value };
  });

  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    const prevPoint = points[index - 1];
    const cp1x = prevPoint.x + (point.x - prevPoint.x) / 3;
    const cp1y = prevPoint.y;
    const cp2x = point.x - (point.x - prevPoint.x) / 3;
    const cp2y = point.y;
    return `${path} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${point.x} ${point.y}`;
  }, "");

  const areaPath = `${pathData} L ${points[points.length - 1].x} ${
    height - padding
  } L ${padding} ${height - padding} Z`;

  return (
    <View style={styles.chartWrapper}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient
            id="areaGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <Stop offset="0%" stopColor="#FF7F11" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#FF7F11" stopOpacity="0" />
          </SvgLinearGradient>
          <SvgLinearGradient
            id="lineGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor="#FF9F40" />
            <Stop offset="100%" stopColor="#FF7F11" />
          </SvgLinearGradient>
        </Defs>

        <Path d={areaPath} fill="url(#areaGradient)" />

        <Path
          d={pathData}
          stroke="url(#lineGradient)"
          strokeWidth="3"
          fill="transparent"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#FF7F11"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        ))}
      </Svg>

      <View style={styles.chartLabels}>
        {labels.map((label, index) => (
          <Text key={index} style={styles.chartLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const Statistics = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const tabWidth = useMemo(() => (SCREEN_WIDTH - 48 - 8) / 2, []);

  const currentLabel = TABS[selectedIndex];
  const currentData = DATASETS[currentLabel];
  const currentLabels = LABELS[currentLabel];

  const onTabPress = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      Animated.spring(translateX, {
        toValue: index * tabWidth,
        useNativeDriver: false,
        tension: 300,
        friction: 20,
      }).start();
    },
    [translateX, tabWidth]
  );

  const shareToInstagram = useCallback(async () => {
    try {
      const message = `욕설 통계 리포트\n\n진동 횟수: 12회\n활성화 시간: 68시간 12분\n\nTOP 3 욕설:\n${WORDS.slice(
        0,
        3
      )
        .map((item, index) => `${index + 1}. ${item.word} (${item.count}회)`)
        .join("\n")}\n\n#욕설통계 #자기계발`;

      await Share.share({
        message: message,
        title: "욕설 통계 공유",
      });
    } catch {
      Alert.alert("공유 실패", "공유 중 오류가 발생했습니다.");
    }
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerName}>이재환 님</Text>
          <Text style={styles.headerSubtitle}>
            지난 기록을 한눈에 정리했어요.
          </Text>
        </View>

        {/* Tab Section */}
        <View style={styles.tabWrapper}>
          <View style={styles.tabContainer}>
            <Animated.View
              style={[
                styles.activeTabHighlight,
                {
                  transform: [{ translateX }],
                  width: tabWidth,
                },
              ]}
            />
            {TABS.map((tab, i) => (
              <TouchableOpacity
                key={tab}
                onPress={() => onTabPress(i)}
                style={styles.tabButton}
                activeOpacity={0.7}
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
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>욕설 사용 빈도</Text>
          <CustomChart
            data={currentData}
            labels={currentLabels}
            width={SCREEN_WIDTH - 64}
            height={200}
          />
        </View>

        {/* Metrics Section */}
        <View style={styles.metricsWrapper}>
          <MetricsCard
            activeTime="68:12"
            vibrationCount={12}
            activeTimePercent={68.2}
            compact={false}
          />
        </View>

        {/* Word List Section */}
        <View style={styles.wordListContainer}>
          <Text style={styles.sectionTitle}>자주 사용한 욕설</Text>
          {WORDS.map((item, index) => (
            <LinearGradient
              key={`${item.word}-${index}`}
              colors={["#1A1A1A", "#1F1F1F"]}
              style={styles.wordItem}
            >
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Text style={styles.wordText}>{item.word}</Text>
              <View style={styles.wordCountBadge}>
                <Text style={styles.wordCount}>{item.count}회</Text>
              </View>
            </LinearGradient>
          ))}
        </View>

        {/* Instagram Share Button */}
        <TouchableOpacity
          style={styles.instagramButton}
          onPress={shareToInstagram}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#FF9F40", "#FF7F11"]}
            style={styles.instagramButtonGradient}
          >
            <Text style={styles.instagramButtonText}>
              인스타그램 스토리 공유하기
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginBottom: 32,
  },
  headerName: {
    fontSize: 24,
    color: "#FF7F11",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "400",
    opacity: 0.8,
  },
  tabWrapper: {
    marginBottom: 32,
  },
  tabContainer: {
    height: 56,
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 4,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  activeTabHighlight: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 12,
    backgroundColor: "#FF7F11",
    zIndex: 0,
    shadowColor: "#FF7F11",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabText: {
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "600",
    color: "#888888",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  chartContainer: {
    backgroundColor: "#141414",
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  chartTitle: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  chartWrapper: {
    position: "relative",
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    marginTop: 16,
  },
  chartLabel: {
    fontSize: 12,
    color: "#888888",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "500",
    textAlign: "center",
  },
  metricsWrapper: {
    marginBottom: 32,
  },
  wordListContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "700",
    marginBottom: 16,
  },
  wordItem: {
    height: 64,
    borderRadius: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF7F11",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  rankText: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "700",
    color: "#FFFFFF",
  },
  wordText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "600",
  },
  wordCountBadge: {
    backgroundColor: "#333333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  wordCount: {
    color: "#FF7F11",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "600",
  },
  instagramButton: {
    marginBottom: 0,
  },
  instagramButtonGradient: {
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#FF7F11",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  instagramButtonText: {
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default Statistics;
