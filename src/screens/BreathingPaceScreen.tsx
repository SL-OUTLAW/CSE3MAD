import { router } from "expo-router";
import { Accelerometer } from "expo-sensors";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

type BreathingPaceScreenProps = {
  onBack: () => void;
  onSubmit: () => void;
};

const RECORD_DURATION_SEC = 20;
const SAMPLE_INTERVAL_MS = 100;
const SCREEN_WIDTH = Dimensions.get("window").width;

type AttemptResult = {
  restSamples: number[];
  exerciseSamples: number[];
};

type RecordState =
  | "idle"
  | "countdown_rest"
  | "recording_rest"
  | "transition"
  | "countdown_exercise"
  | "recording_exercise"
  | "done";
const CHART_CONFIG = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(0, 110, 255, 1)`,
  labelColor: () => "black",
  style: { borderRadius: 16 },
  strokeWidth: 1,
  propsForDots: {
    r: "0",
    strokeWidth: "1",
    stroke: "#000000",
  },
  propsForBackgroundLines: {
    strokeDasharray: "",
    stroke: "#e2e8f0",
    strokeWidth: 1,
  },
  paddingRight: 0,
  paddingLeft: 0,
};

const EXERCISE_CHART_CONFIG = {
  ...CHART_CONFIG,
  color: (opacity = 1) => "rgba(255, 0, 0, 1)",
  propsForBackgroundLines: {
    strokeDasharray: "",
    stroke: "#e2e8f0",
    strokeWidth: 1,
  },
  hideLabels: true,
};
function BreathingChart({
  samples,
  config,
  width,
  height,
}: {
  samples: number[];
  config: typeof CHART_CONFIG;
  width: number;
  height: number;
}) {
  const chartData = samples.length > 0 ? samples : [0, 0];

  return (
    <View
      style={{
        overflow: "hidden",
        borderRadius: 16,
        alignSelf: "center",
      }}
    >
      <LineChart
        data={{
          labels: Array(chartData.length).fill(""),
          datasets: [
            {
              data: chartData,
              strokeWidth: 1,
            },
          ],
        }}
        width={width}
        height={height}
        withDots={false}
        withInnerLines
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLabels={false}
        withVerticalLabels={false}
        bezier
        segments={3}
        fromZero={false}
        chartConfig={{
          ...config,
          paddingRight: 0,
        }}
        style={{
          borderRadius: 16,
          paddingRight: 0,
          marginLeft: -10,
        }}
      />
    </View>
  );
}

function ComparisonChart({
  restSamples,
  exerciseSamples,
  width,
  height,
}: {
  restSamples: number[];
  exerciseSamples: number[];
  width: number;
  height: number;
}) {
  const maxLength = Math.max(restSamples.length, exerciseSamples.length);

  const normalize = (arr: number[]) => {
    if (arr.length === maxLength) return arr;

    const padded = [...arr];

    while (padded.length < maxLength) {
      padded.push(arr[arr.length - 1] ?? 0);
    }

    return padded;
  };

  const rData = normalize(restSamples.length ? restSamples : [0]);
  const eData = normalize(exerciseSamples.length ? exerciseSamples : [0]);

  return (
    <View
      style={{
        overflow: "hidden",
        borderRadius: 16,
        alignSelf: "center",
      }}
    >
      <LineChart
        data={{
          labels: Array(maxLength).fill(""),
          datasets: [
            {
              data: rData,
              color: () => "rgba(37, 99, 235, 0.6)",
              strokeWidth: 1,
            },
            {
              data: eData,
              color: () => "rgba(220, 38, 38, 0.6)",
              strokeWidth: 1,
            },
          ],
        }}
        width={width}
        height={height}
        withDots={false}
        withInnerLines
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLabels={false}
        withVerticalLabels={false}
        bezier
        segments={3}
        fromZero={false}
        chartConfig={{
          ...CHART_CONFIG,
          fillShadowGradientOpacity: 0,
          fillShadowGradientFromOpacity: 0,
          fillShadowGradientToOpacity: 0,
          paddingRight: 0,
        }}
        style={{
          borderRadius: 16,
          paddingRight: 0,
          marginLeft: 0,
        }}
      />
    </View>
  );
}
function AttemptModal({
  attempt,
  attemptNumber,
  onClose,
}: {
  attempt: AttemptResult | null;
  attemptNumber: number;
  onClose: () => void;
}) {
  if (!attempt) return null;
  const modalChartWidth = SCREEN_WIDTH - 88;

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Attempt #{attemptNumber}</Text>
            <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
              <Text
                style={[
                  modalStyles.closeBtnText,
                  { color: "black", fontWeight: 700 },
                ]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 420 }}
          >
            <Text style={modalStyles.chartLabel}>Comparison</Text>
            <View style={modalStyles.chartContainer}>
              <ComparisonChart
                restSamples={attempt.restSamples}
                exerciseSamples={attempt.exerciseSamples}
                width={modalChartWidth}
                height={200}
              />
            </View>

            <Text style={[modalStyles.chartLabel, { color: "#2563eb" }]}>
              Rest Chart
            </Text>
            <View style={modalStyles.chartContainer}>
              <BreathingChart
                samples={attempt.restSamples}
                config={CHART_CONFIG}
                width={modalChartWidth}
                height={200}
              />
            </View>

            <Text style={[modalStyles.chartLabel, { color: "#dc2626" }]}>
              Post-Exercise Chart
            </Text>
            <View style={modalStyles.chartContainer}>
              <BreathingChart
                samples={attempt.exerciseSamples}
                config={EXERCISE_CHART_CONFIG}
                width={modalChartWidth}
                height={200}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[
              modalStyles.doneBtn,
              { backgroundColor: "#1e293b", marginTop: 20 },
            ]}
            onPress={onClose}
          >
            <Text style={modalStyles.doneBtnText}>Close Analysis</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
export default function BreathingPaceScreen({
  onBack,
  onSubmit,
}: BreathingPaceScreenProps) {
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);

  const [liveSamples, setLiveSamples] = useState<number[]>([]);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [modalAttempt, setModalAttempt] = useState<{
    attempt: AttemptResult;
    idx: number;
  } | null>(null);
  const [currentRestSamples, setCurrentRestSamples] = useState<number[] | null>(
    null,
  );

  const isRecordingRef = useRef(false);
  const samplesRef = useRef<number[]>([]);
  const startTimeRef = useRef(0);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRecording =
    recordState === "recording_rest" || recordState === "recording_exercise";
  const currentColor = recordState.includes("rest") ? "#2563eb" : "#dc2626";
  const currentLabel = recordState.includes("rest") ? "Rest" : "Exercise";
  const latestAttempt = attempts[attempts.length - 1] ?? null;

  useEffect(() => {
    Accelerometer.isAvailableAsync().then((ok) => {
      if (!ok)
        Alert.alert(
          "Sensor unavailable",
          "Accelerometer not supported on this device.",
        );
    });
  }, []);
  useEffect(() => {
    let sub: any;
    if (isRecording) {
      Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
      sub = Accelerometer.addListener(({ y }) => {
        if (!isRecordingRef.current) return;
        samplesRef.current = [...samplesRef.current, y];
        setLiveSamples([...samplesRef.current]);
      });
    }
    return () => sub?.remove();
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) return;
    startTimeRef.current = Date.now();
    recordTimerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      if (secs >= RECORD_DURATION_SEC) stopRecording();
    }, 200);
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [recordState]);

  useEffect(() => {
    if (
      recordState !== "countdown_rest" &&
      recordState !== "countdown_exercise"
    )
      return;
    let c = 3;
    setCountdown(c);
    countdownTimerRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countdownTimerRef.current!);
        beginRecording();
      }
    }, 1000);
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [recordState]);

  function beginRecording() {
    samplesRef.current = [];
    setLiveSamples([]);
    setElapsed(0);
    isRecordingRef.current = true;
    setRecordState((prev) =>
      prev === "countdown_rest" ? "recording_rest" : "recording_exercise",
    );
  }

  function stopRecording() {
    isRecordingRef.current = false;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const savedSamples = [...samplesRef.current];

    if (savedSamples.length < 2) {
      setRecordState("idle");
      return;
    }

    if (recordState === "recording_rest") {
      setCurrentRestSamples(savedSamples);
      setRecordState("transition");
    } else if (recordState === "recording_exercise") {
      if (!currentRestSamples) return;
      const fullAttempt: AttemptResult = {
        restSamples: currentRestSamples,
        exerciseSamples: savedSamples,
      };
      setAttempts((prev) => [...prev, fullAttempt]);
      setRecordState("done");
      setCurrentRestSamples(null);
    }
  }
  const progressPct = Math.min(elapsed / RECORD_DURATION_SEC, 1);
  const timeLeft = Math.max(0, RECORD_DURATION_SEC - elapsed);

  return (
    <>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.phoneFrame}>
          <Text style={styles.headerTitle}>Breathing Pace Trainer</Text>

          <View style={styles.sensorCard}>
            <Text style={styles.cardHeader}>Live Sensor Data</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricColumn}>
                <Text style={[styles.metricValue, { color: currentColor }]}>
                  {recordState === "idle" || recordState === "done"
                    ? "-"
                    : currentLabel}
                </Text>
                <Text style={styles.metricLabel}>Phase</Text>
              </View>
              <View style={styles.metricColumn}>
                <Text style={[styles.metricValue, { color: currentColor }]}>
                  {isRecording ? `${liveSamples.length}` : "-"}
                </Text>
                <Text style={styles.metricLabel}>Samples</Text>
              </View>
              <View style={styles.metricColumn}>
                <Text
                  style={[
                    styles.statusText,
                    isRecording && { color: "red" },
                    recordState === "done" && { color: "#16a34a" },
                    recordState.includes("countdown") && { color: "#ff0000" },
                    recordState === "transition" && { color: "#16a34a" },
                  ]}
                >
                  {isRecording
                    ? `${timeLeft}s`
                    : recordState.includes("countdown")
                      ? `${countdown}s`
                      : "SENSOR\nACTIVE"}
                </Text>
              </View>
            </View>
          </View>

          {isRecording && (
            <View style={[styles.sensorCard, { paddingBottom: 20 }]}>
              <Text style={styles.cardHeader}>
                Live Sensor Data • {currentLabel}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPct * 100}%`,
                      backgroundColor: currentColor,
                    },
                  ]}
                />
              </View>
              <BreathingChart
                samples={liveSamples}
                config={
                  recordState.includes("rest")
                    ? CHART_CONFIG
                    : EXERCISE_CHART_CONFIG
                }
                width={SCREEN_WIDTH - 72}
                height={200}
              />
            </View>
          )}

          {recordState === "done" && latestAttempt && (
            <View style={[styles.sensorCard, { paddingBottom: 20 }]}>
              <Text style={styles.cardHeader}>Comparison</Text>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendLine, { backgroundColor: "#2563eb" }]}
                  />
                  <Text style={styles.legendText}>Rest</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendLine, { backgroundColor: "#dc2626" }]}
                  />
                  <Text style={styles.legendText}>Post-Exercise</Text>
                </View>
              </View>
              <ComparisonChart
                restSamples={latestAttempt.restSamples}
                exerciseSamples={latestAttempt.exerciseSamples}
                width={SCREEN_WIDTH - 88}
                height={200}
              />
            </View>
          )}

          {recordState === "idle" && (
            <View style={[styles.sensorCard, { height: 300 }]}>
              <Text style={[styles.cardHeader, { fontSize: 20 }]}>
                Rest Breathing Pace
              </Text>
              <Text style={styles.instructStep}>
                1. Lie stationary on a flat surface.
              </Text>
              <Text style={styles.instructStep}>
                2. Place device with Side Quest app over your chest.
              </Text>
              <Text style={styles.instructStep}>
                3. Breathe for {RECORD_DURATION_SEC} seconds.
              </Text>
            </View>
          )}

          {recordState === "transition" && (
            <View style={styles.sensorCard}>
              <Text style={styles.cardHeader}>
                Post-Exercise Breathing Pace
              </Text>
              <Text style={styles.instructStep}>
                1. Lift the operational smartphone setup away from your body.
              </Text>
              <Text style={styles.instructStep}>
                2. Perform light exercise.
              </Text>
              <Text style={styles.instructStep}>
                3. Immediately resume your flat positioning.
              </Text>
              <Text style={styles.instructStep}>
                4. Replace the device on your chest and press Continue
              </Text>
            </View>
          )}

          {recordState.includes("countdown") && (
            <View style={[styles.sensorCard, { height: 300 }]}>
              <Text style={styles.cardHeader}>Starting in..</Text>
              <View style={{ alignItems: "center", marginVertical: 10 }}>
                <Text
                  style={[
                    styles.metricValue,
                    { fontSize: 54, color: "#1d5db1" },
                  ]}
                >
                  {countdown}
                </Text>
                <Text style={styles.metricLabel}>
                  Keep the phone centered and steady
                </Text>
              </View>
            </View>
          )}

          {attempts.length > 0 && (
            <View style={styles.sensorCard}>
              <Text style={styles.cardHeader}>Attempts</Text>
              {attempts.map((a, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.attemptRow}
                  onPress={() => setModalAttempt({ attempt: a, idx })}
                >
                  <Text style={styles.attemptIndex}>#{idx + 1}</Text>
                  <View style={styles.attemptDetails}>
                    <Text style={styles.attemptMovement}>
                      Attempt {idx + 1}
                    </Text>
                    <Text style={styles.attemptStat}>
                      Rest Samples: {a.restSamples.length} • Exercise Samples:{" "}
                      {a.exerciseSamples.length}
                    </Text>
                  </View>
                  <Text style={styles.attemptChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {recordState === "idle" && (
            <TouchableOpacity
              style={[styles.trackingButton, { backgroundColor: "#2563eb" }]}
              onPress={() => setRecordState("countdown_rest")}
            >
              <Text style={styles.trackingButtonText}>Start</Text>
            </TouchableOpacity>
          )}

          {recordState === "transition" && (
            <TouchableOpacity
              style={[styles.trackingButton, { backgroundColor: "#2563eb" }]}
              onPress={() => setRecordState("countdown_exercise")}
            >
              <Text style={styles.trackingButtonText}>Continue</Text>
            </TouchableOpacity>
          )}

          {isRecording && (
            <TouchableOpacity
              style={[styles.trackingButton, { backgroundColor: "#000" }]}
              onPress={stopRecording}
            >
              <Text style={styles.trackingButtonText}>Stop</Text>
            </TouchableOpacity>
          )}

          {recordState === "done" && (
            <TouchableOpacity
              style={[styles.trackingButton, { backgroundColor: "#16a34a" }]}
              onPress={() => setRecordState("idle")}
            >
              <Text style={styles.trackingButtonText}>New Attempt</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logButton} onPress={onBack}>
            <View style={styles.logButtonContent}>
              <Text style={styles.logButtonText}>Log Results</Text>
              <Text style={styles.arrowIcon}>➔</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.quitButton} onPress={onBack}>
              <Text style={styles.bottomButtonText}>Quit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={attempts.length > 0 ? onSubmit : undefined}
            >
              <Text style={styles.bottomButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <AttemptModal
        attempt={modalAttempt?.attempt ?? null}
        attemptNumber={(modalAttempt?.idx ?? 0) + 1}
        onClose={() => setModalAttempt(null)}
      />
    </>
  );
}
const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: "#ffffff" },
  scrollContent: { alignItems: "center", paddingVertical: 20 },
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
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  metricColumn: { alignItems: "center", minWidth: 75 },
  metricValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#16a34a",
    marginBottom: 2,
  },
  metricLabel: { fontSize: 14, color: "#000000", fontWeight: "800" },
  statusText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#16a34a",
    textAlign: "center",
    width: 85,
    lineHeight: 20,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: { height: "100%" as any, borderRadius: 4 },
  legend: { flexDirection: "row", gap: 20, marginBottom: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendLine: { width: 20, height: 3, borderRadius: 2 },
  legendText: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  instructStep: {
    fontSize: 18,
    color: "#000000",
    marginBottom: 8,
    lineHeight: 20,
    fontWeight: 600,
  },
  attemptRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 10,
  },
  attemptIndex: {
    fontSize: 16,
    fontWeight: "800",
    width: 28,
    color: "#1d5db1",
  },
  attemptDetails: { flex: 1 },
  attemptMovement: { fontSize: 14, fontWeight: "700", color: "#000000" },
  attemptStat: { fontSize: 11, color: "#666666", marginTop: 2 },
  attemptChevron: { fontSize: 24, color: "#cbd5e1", fontWeight: "300" },
  trackingButton: {
    borderRadius: 14,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,
  },
  trackingButtonText: { color: "#ffffff", fontSize: 20, fontWeight: "400" },
  bottomRow: { flexDirection: "row", justifyContent: "space-between" },
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
});
const modalStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#000000", marginTop: 10 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  closeBtnText: { fontSize: 14, color: "#64748b", fontWeight: "700" },
  chartLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 10,
    marginTop: 10,
  },
  chartContainer: { marginBottom: 24 },
  doneBtn: {
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
});
