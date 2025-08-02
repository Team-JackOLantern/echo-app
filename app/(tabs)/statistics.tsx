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
  Line,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import MetricsCard from "@/components/MetricsCard";

const SCREEN_WIDTH = Dimensions.get("window").width;
const TABS = ["오늘", "이번 주"] as const;

const HOURLY_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  value: Math.floor(Math.random() * 30) + 5,
  label: `${i}시`,
}));

const WEEKLY_DATA = [
  { day: "월", value: 45, label: "월" },
  { day: "화", value: 32, label: "화" },
  { day: "수", value: 67, label: "수" },
  { day: "목", value: 23, label: "목" },
  { day: "금", value: 89, label: "금" },
  { day: "토", value: 56, label: "토" },
  { day: "일", value: 34, label: "일" },
];

const WORDS = [
  { word: "시발", count: 24 },
  { word: "씨발", count: 18 },
  { word: "개새끼", count: 15 },
  { word: "병신", count: 12 },
  { word: "미친", count: 8 },
];

interface CustomChartProps {
  type: "today" | "week";
}

const CustomChart: React.FC<CustomChartProps> = ({ type }) => {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const chartHeight = 200;
  const padding = 20;

  const data = type === "today" ? HOURLY_DATA : WEEKLY_DATA;
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const valueRange = maxValue - minValue || 1;

  const visibleData = data;
  const pointSpacing = type === "today" ? 50 : 0;

  const chartWidth =
    type === "today"
      ? visibleData.length * pointSpacing + padding * 2
      : SCREEN_WIDTH - 40;

  const points = visibleData.map((item, index) => {
    const x =
      type === "today"
        ? padding + index * pointSpacing
        : padding +
          (index * (chartWidth - padding * 2)) /
            Math.max(visibleData.length - 1, 1);
    const y =
      padding +
      (chartHeight - padding * 2) -
      ((item.value - minValue) / valueRange) * (chartHeight - padding * 2);
    return {
      x,
      y,
      value: item.value,
      label: item.label,
    };
  });

  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    const prevPoint = points[index - 1];
    const cp1x = prevPoint.x + (point.x - prevPoint.x) / 2.5;
    const cp1y = prevPoint.y;
    const cp2x = point.x - (point.x - prevPoint.x) / 2.5;
    const cp2y = point.y;
    return `${path} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${point.x} ${point.y}`;
  }, "");

  const areaPath = `${pathData} L ${points[points.length - 1]?.x || 0} ${
    chartHeight - padding
  } L ${padding} ${chartHeight - padding} Z`;

  const handlePointPress = (index: number) => {
    setSelectedPoint(selectedPoint === index ? null : index);
  };

  const getTooltipLeft = (pointX: number) => {
    const tooltipWidth = 75;
    const viewportWidth = SCREEN_WIDTH - 40;
    const tooltipLeft = pointX - tooltipWidth / 2;
    return Math.max(
      15,
      Math.min(tooltipLeft, viewportWidth - tooltipWidth - 15)
    );
  };

  const ChartContent = () => (
    <View style={styles.chartContainer}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <SvgLinearGradient
            id="areaGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <Stop offset="0%" stopColor="#FF7F11" stopOpacity="0.25" />
            <Stop offset="40%" stopColor="#FF7F11" stopOpacity="0.15" />
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
            <Stop offset="50%" stopColor="#FF8C28" />
            <Stop offset="100%" stopColor="#FF7F11" />
          </SvgLinearGradient>
        </Defs>

        <Path d={areaPath} fill="url(#areaGradient)" />

        <Path
          d={pathData}
          stroke="url(#lineGradient)"
          strokeWidth="2.5"
          fill="transparent"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {selectedPoint !== null && points[selectedPoint] && (
          <Line
            x1={points[selectedPoint].x}
            y1={points[selectedPoint].y}
            x2={points[selectedPoint].x}
            y2={chartHeight - padding}
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            opacity="0.6"
          />
        )}

        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={selectedPoint === index ? "6" : "4"}
            fill="#FF7F11"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeOpacity="0.3"
          />
        ))}
      </Svg>

      {points.map((point, index) => (
        <TouchableOpacity
          key={`touch-${index}`}
          onPress={() => handlePointPress(index)}
          style={{
            position: "absolute",
            left: point.x - 25,
            top: point.y - 25,
            width: 50,
            height: 50,
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      ))}

      {selectedPoint !== null && points[selectedPoint] && (
        <View
          style={[
            styles.tooltip,
            {
              left: getTooltipLeft(points[selectedPoint].x),
              top: 10,
              width: 75,
              height: 50,
            },
          ]}
        >
          <Text style={styles.tooltipText}>
            {points[selectedPoint].value}회
          </Text>
          <Text style={styles.tooltipLabel}>{points[selectedPoint].label}</Text>
        </View>
      )}

      {/* 오늘 탭일 때만 라벨을 차트 안에 포함 */}
      {type === "today" && (
        <View style={styles.chartLabelsInside}>
          {points.map((point, index) => (
            <Text
              key={index}
              style={[
                styles.chartLabel,
                {
                  position: "absolute",
                  left: point.x - 15,
                  width: 30,
                  bottom: -30,
                },
              ]}
            >
              {point.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  if (type === "today") {
    return (
      <View style={styles.chartWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 40 }}
          style={{ width: SCREEN_WIDTH - 40 }}
        >
          <ChartContent />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.chartWrapper}>
      <ChartContent />
      {/* 이번주 탭일 때만 외부에 라벨 표시 */}
      <View style={styles.chartLabels}>
        {points.map((point, index) => (
          <Text key={index} style={styles.chartLabel}>
            {point.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const Statistics = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(0)).current;

  const tabWidth = useMemo(() => (SCREEN_WIDTH - 48 - 8) / 2, []);

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
      <LinearGradient
        colors={["#0A0A0A", "#0F0F0F", "#141414"]}
        style={styles.container}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerName}>jbj338033 님</Text>
            <Text style={styles.headerSubtitle}>
              지난 기록을 한눈에 정리했어요.
            </Text>
          </View>

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

          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>욕설 사용 빈도</Text>
            <CustomChart type={selectedIndex === 0 ? "today" : "week"} />
          </View>

          <View style={styles.metricsContainer}>
            <MetricsCard
              activeTime="68:12"
              vibrationCount={12}
              activeTimePercent={68.2}
              compact={true}
            />
          </View>

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
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
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
    height: 48,
    flexDirection: "row",
    backgroundColor: "rgba(118, 118, 128, 0.12)",
    borderRadius: 10,
    padding: 2,
    position: "relative",
  },
  activeTabHighlight: {
    position: "absolute",
    top: 2,
    bottom: 2,
    left: 2,
    borderRadius: 8,
    backgroundColor: "rgba(118, 118, 128, 0.24)",
    zIndex: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "600",
    color: "rgba(235, 235, 245, 0.6)",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  chartSection: {
    marginBottom: 32,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  chartWrapper: {
    width: SCREEN_WIDTH - 40,
    height: 270,
  },
  chartContainer: {
    position: "relative",
    height: 240,
  },
  chartLabels: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 30,
    alignItems: "center",
  },
  chartLabelsInside: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
  },
  chartLabel: {
    fontSize: 12,
    color: "#888888",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "500",
    textAlign: "center",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "rgba(42, 42, 46, 0.95)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tooltipText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 3,
  },
  tooltipLabel: {
    fontSize: 10,
    color: "#AAAAAA",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "500",
    textAlign: "center",
  },
  metricsContainer: {
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
    color: "#FFFFFF",
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
