import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";

interface CircularProgressProps {
  progress: number;
  size: number;
  strokeWidth: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size,
  strokeWidth,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <Stop offset="0%" stopColor="#FF9F40" />
            <Stop offset="100%" stopColor="#FF7F11" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2A2A2A"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
};

interface MetricsCardProps {
  activeTime: string;
  vibrationCount: number;
  activeTimePercent: number;
  compact?: boolean;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  activeTime,
  vibrationCount,
  activeTimePercent,
  compact = false,
}) => {
  const size = compact ? 70 : 90;
  const strokeWidth = compact ? 6 : 8;

  return (
    <View style={[styles.metricsSection, compact && styles.compactMetrics]}>
      <View style={[styles.metricCard, compact && styles.compactCard]}>
        <Text style={[styles.metricTitle, compact && styles.compactTitle]}>
          활성화 시간
        </Text>
        <View style={styles.circularProgressContainer}>
          <CircularProgress
            progress={activeTimePercent}
            size={size}
            strokeWidth={strokeWidth}
          />
          <View
            style={[
              styles.circularProgressOverlay,
              { width: size, height: size },
            ]}
          >
            <Text style={[styles.timeText, compact && styles.compactTimeText]}>
              {activeTime}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.metricCard, compact && styles.compactCard]}>
        <Text style={[styles.metricTitle, compact && styles.compactTitle]}>
          진동 횟수
        </Text>
        <View style={styles.countContainer}>
          <Text
            style={[styles.countNumber, compact && styles.compactCountNumber]}
          >
            {vibrationCount}
          </Text>
          <Text style={[styles.countUnit, compact && styles.compactCountUnit]}>
            회
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metricsSection: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  compactMetrics: {
    gap: 12,
  },
  metricCard: {
    flex: 1,
    alignItems: "center",
    minHeight: 160,
    justifyContent: "space-between",
    paddingVertical: 24,
  },
  compactCard: {
    minHeight: 120,
    paddingVertical: 16,
  },
  metricTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "600",
    textAlign: "center",
  },
  compactTitle: {
    fontSize: 12,
  },
  circularProgressContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  circularProgressOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "700",
    textAlign: "center",
  },
  compactTimeText: {
    fontSize: 14,
  },
  countContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  countNumber: {
    fontSize: 44,
    color: "#FF7F11",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "900",
    lineHeight: 50,
  },
  compactCountNumber: {
    fontSize: 32,
    lineHeight: 36,
  },
  countUnit: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontWeight: "600",
    marginTop: 4,
  },
  compactCountUnit: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default MetricsCard;
