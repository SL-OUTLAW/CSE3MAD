import { Accelerometer } from "expo-sensors";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { calculateSeismicVibration } from "../services/physicsCalculationService";
import { useAccessibility } from "../../context/AccessibilityContext";

type HumanPerformanceLabScreenProps = {
  onBack: () => void;
  onLogResults: () => void;
  onSubmit: () => void;
  hasDraft?: boolean;
  activityId?: string;
  activityTitle?: string;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

const MOVEMENTS = [
  { id: 1, label: "Movement 1", description: "Circular arm movement" },
  { id: 2, label: "Movement 2", description: "Vertical arm movement" },
  { id: 3, label: "Movement 3", description: "Horizontal arm movement" },
];

const ATTEMPT_DURATION_SECONDS = 10;

type AttemptResult = {
  movementId: number;
  durationSeconds: number;
  peakVibration: number;
  avgVibration: number;
};

export default function HumanPerformanceLabScreen({
  onBack,
  onSubmit,
  onLogResults,
  hasDraft,
}: HumanPerformanceLabScreenProps) {
  const { colours, highContrast } = useAccessibility();
  const [isTracking, setIsTracking] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(1);
  const [vibration, setVibration] = useState(0.0);
  const [peakVibration, setPeakVibration] = useState(0.0);
  const [status, setStatus] = useState("SENSOR ACTIVE");
  const [vibrationHistory, setVibrationHistory] = useState<number[]>([
    0, 0, 0, 0, 0,
  ]);

  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [countdown, setCountdown] = useState(ATTEMPT_DURATION_SECONDS);
  const [isRecording, setIsRecording] = useState(false);

  const sessionDataRef = useRef<number[]>([]);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const cardStyle = [
  styles.sensorCard,
  {
    backgroundColor: colours.card,
    borderColor: colours.border,
    borderWidth: highContrast ? 3 : 1,
  },
];

  useEffect(() => {
    let subscription: any;

    const startSensor = async () => {
      const available = await Accelerometer.isAvailableAsync();
      if (!available) {
        Alert.alert(
          "Error",
          "Accelerometer sensor is unavailable on this device.",
        );
        return;
      }

      Accelerometer.setUpdateInterval(100);

      subscription = Accelerometer.addListener(({ x, y, z }) => {
        if (!isTracking) return;

        calculateSeismicVibration({ x, y, z }).then((result) => {
          const netVibration = result.accelMagnitude;

          setVibration(netVibration);
          setPeakVibration((prev) => Math.max(prev, netVibration));

          setVibrationHistory((prev) => {
            const updated = [...prev, netVibration];
            if (updated.length > 10) updated.shift();
            return updated;
          });

          if (isRecording) {
            sessionDataRef.current.push(netVibration);
          }
        });
      });
    };

    if (isTracking) {
      startSensor();
    }

    return () => {
      subscription?.remove();
    };
  }, [isTracking, isRecording]);

  const startAttempt = () => {
    if (isRecording) return;

    sessionDataRef.current = [];
    setPeakVibration(0);
    setCountdown(ATTEMPT_DURATION_SECONDS);
    setIsTracking(true);
    setIsRecording(true);
    setStatus("RECORDING");

    let remaining = ATTEMPT_DURATION_SECONDS;

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current!);
        finishAttempt();
      }
    }, 1000);
  };

  const finishAttempt = () => {
    setIsRecording(false);
    setIsTracking(false);
    setStatus("ATTEMPT SAVED");

    const samples = [...sessionDataRef.current];
    const peak = samples.length > 0 ? Math.max(...samples) : 0;
    const avg =
      samples.length > 0
        ? samples.reduce((a, b) => a + b, 0) / samples.length
        : 0;

    const result: AttemptResult = {
      movementId: selectedMovement,
      durationSeconds: ATTEMPT_DURATION_SECONDS,
      peakVibration: peak,
      avgVibration: avg,
    };

    setAttempts((prev) => [...prev, result]);
  };

  const stopEarly = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    finishAttempt();
  };

  return (
    <ScrollView
      style={[styles.scrollContainer, { backgroundColor: colours.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.phoneFrame, { backgroundColor: colours.background }]}>
        <Text style={[styles.headerTitle, { color: colours.text, fontSize: 24 * colours.textScale }]}>Human Performance Lab</Text>

        <View style={cardStyle}>
          <Text style={[styles.cardHeader, { color: colours.text, fontSize: 18 * colours.textScale }]}>Select Movement</Text>
          <View style={styles.movementRow}>
            {MOVEMENTS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.movementButton,
                  {borderColor: selectedMovement === m.id ? colours.primary : colours.border,
                    borderWidth: highContrast ? 3 : 1.5,
                    backgroundColor: selectedMovement === m.id ? colours.inactiveButton : colours.card,},
                ]}
                onPress={() => {
                  if (!isRecording) setSelectedMovement(m.id);
                }}
              >
                <Text
                  style={[
                    styles.movementButtonText,
                    { color: selectedMovement === m.id ? colours.primary : colours.text, fontSize: 14 * colours.textScale },
                  ]}
                >
                  {m.label}
                </Text>
                <Text
                  style={[
                    styles.movementDesc,
                    { color: selectedMovement === m.id ? colours.primary : colours.text, fontSize: 10 * colours.textScale },
                  ]}
                >
                  {m.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={cardStyle}>
          <Text style={[styles.cardHeader, { color: colours.text, fontSize: 18 * colours.textScale }]}>Live Sensor Data</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricColumn}>
              <Text style={[styles.metricValue, { color: colours.primary, fontSize: 26 * colours.textScale }]}>
                {vibration.toFixed(2)}g
              </Text>
              <Text style={[styles.metricLabel, { color: colours.text, fontSize: 14 * colours.textScale }]}>
                Vibration
              </Text>
            </View>

            <View style={styles.metricColumn}>
              <Text style={[styles.metricValue, { color: colours.danger, fontSize: 26 * colours.textScale }]}>
                {peakVibration.toFixed(2)}g
              </Text>
              <Text style={[styles.metricLabel, { color: colours.text, fontSize: 14 * colours.textScale }]}>
                Peak 
              </Text>
            </View>

            <View style={styles.metricColumn}>
              <Text
                style={[
                  styles.statusText,
                  { color: colours.primary, fontSize: 14 * colours.textScale },
                  status === "RECORDING" && { color: colours.danger },
                  status === "ATTEMPT SAVED" && { color: colours.success },
                ]}
              >
                {isRecording ? `${countdown}s` : status}
              </Text>
            </View>
          </View>
        </View>

        <View style={[cardStyle, { paddingBottom: 0 }]}>
          <Text style={[styles.cardHeader, { color: colours.subText, fontSize: 18 * colours.textScale }]}>Vibration Chart (g)</Text>

          <Text
            style={[
              styles.cardHeader,
              {
                fontSize: 14,
                color: "red",
                fontWeight: "700",
                marginBottom: 5,
              },
            ]}
          >
            Peak: {peakVibration.toFixed(2)}g
          </Text>
          {attempts.length > 0 && (
            <Text
              style={[
                styles.cardHeader,
                { fontSize: 14, color: "red", fontWeight: "700" },
              ]}
            >
              <Text
                style={[
                  styles.cardHeader,
                  { fontSize: 14, color: "red", fontWeight: "700" },
                ]}
              >
                Average: {attempts[attempts.length - 1].avgVibration.toFixed(2)}
                g
              </Text>
            </Text>
          )}

          <LineChart
            data={{
              labels: [],
              datasets: [{ data: vibrationHistory }],
            }}
            width={SCREEN_WIDTH - 95}
            height={150}
            segments={3}
            yAxisSuffix="g"
            chartConfig={{
              backgroundColor: colours.card,
              backgroundGradientFrom: colours.card,
              backgroundGradientTo: colours.card,
              decimalPlaces: 2,
              color: () => colours.primary,
              labelColor: () => colours.text,
              style: { borderRadius: 16 },
              propsForDots: {
                r: "1",
                strokeWidth: "1",
                stroke: colours.primary,
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: colours.border,
                strokeWidth: highContrast ? 2 : 1,
              },
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        {!isRecording ? (
          <TouchableOpacity
            style={[styles.trackingButton, { backgroundColor: colours.success }]}
            onPress={startAttempt}
          >
            <Text style={styles.trackingButtonText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.trackingButton, { backgroundColor: colours.danger }]}
            onPress={stopEarly}
          >
            <Text style={styles.trackingButtonText}>Stop</Text>
          </TouchableOpacity>
        )}

        {attempts.length > 0 && (
          <View style={[cardStyle, { marginBottom: 50 }]}>
            <Text style={[styles.cardHeader, { color: colours.subText, fontSize: 18 * colours.textScale }]}>Attempts</Text>
            {attempts.map((a, idx) => {
              return (
                <View key={idx} style={styles.attemptRow}>
                  <Text style={[styles.attemptIndex, { color: colours.primary, fontSize: 16 * colours.textScale }]}>#{idx + 1}</Text>
                  <View style={styles.attemptDetails}>
                    <Text style={[styles.attemptMovement, { color: colours.text, fontSize: 14 * colours.textScale }]}>
                      {MOVEMENTS.find((m) => m.id === a.movementId)?.label}
                      <Text style={[styles.attemptStat, { color: colours.subText, fontSize: 11 * colours.textScale }]}>
                        {" • "}Avg: {a.avgVibration.toFixed(2)}g • Peak:{" "}
                        {a.peakVibration.toFixed(2)}g
                      </Text>
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={[styles.logButton, { backgroundColor: colours.card, borderColor: colours.border, borderWidth: highContrast ? 3 : 2, }]} onPress={onLogResults}>
          <View style={styles.logButtonContent}>
            <Text style={[styles.logButtonText, { color: colours.text, fontSize: 20 * colours.textScale }]}>Log Results</Text>
            <Text style={[styles.arrowIcon, { color: colours.text, fontSize: 20 * colours.textScale }]}>➔</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <TouchableOpacity style={[styles.quitButton, { backgroundColor: colours.danger, borderColor: colours.border, borderWidth: highContrast ? 3 : 2, }]} onPress={onBack}>
            <Text style={[styles.bottomButtonText, { color: "#ffffff", fontSize: 24 * colours.textScale }]}>Quit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colours.success, borderColor: colours.border, borderWidth: highContrast ? 3 : 2, }]} onPress={onSubmit}>
            <Text style={[styles.bottomButtonText, { color: colours.text, fontSize: 24 * colours.textScale }]}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  phoneFrame: {
    width: "100%",
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 28,
    backgroundColor: "#ffffff",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 40,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 32,
  },
  sensorCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: "#ffffff",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 18,
    color: "#666666",
    fontWeight: "600",
    marginBottom: 16,
  },
  movementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  movementButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  movementButtonActive: {
    borderColor: "#1d5db1",
    backgroundColor: "#eff6ff",
  },
  movementButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000000",
  },
  movementButtonTextActive: {
    color: "#1d5db1",
  },
  movementDesc: {
    fontSize: 10,
    color: "#999999",
    textAlign: "center",
    marginTop: 2,
  },
  movementDescActive: {
    color: "#1d5db1",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  metricColumn: {
    alignItems: "center",
    minWidth: 75,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#16a34a",
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "800",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#16a34a",
    textAlign: "center",
    width: 85,
    lineHeight: 20,
  },
  attemptRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 10,
  },
  attemptIndex: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1d5db1",
    width: 28,
  },
  attemptDetails: {
    flex: 1,
  },
  attemptMovement: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  attemptStat: {
    fontSize: 11,
    color: "#666666",
    marginTop: 2,
  },
  scoreChip: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "700",
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: "800",
  },
  trackingButton: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    height: 56,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  trackingButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "400",
  },
  logButton: {
    borderWidth: 2,
    height: 58,
    borderColor: "#000000",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  logButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logButtonText: {
    fontSize: 20,
    fontWeight: "400",
    color: "#000000",
    textAlign: "center",
    flex: 1,
  },
  arrowIcon: {
    fontSize: 20,
    color: "#999999",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quitButton: {
    backgroundColor: "#F08787",
    borderWidth: 2,
    borderColor: "#000000",
    borderRadius: 30,
    height: 58,
    paddingVertical: 10,
    width: "45%",
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#A3DC9A",
    borderWidth: 2,
    height: 58,
    borderColor: "#000000",
    borderRadius: 30,
    paddingVertical: 10,
    width: "45%",
    alignItems: "center",
  },
  bottomButtonText: {
    fontSize: 24,
    fontWeight: "400",
    color: "#000000",
  },
});
