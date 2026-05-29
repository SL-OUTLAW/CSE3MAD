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
import { useAccessibility } from "../../context/AccessibilityContext";
import {
  BreathingDetectionState,
  createBreathingDetectionState,
  processBreathingSample,
  resetBreathingDetectionState,
  estimateBreathsFromSamples,
  calculateBpmFromBreathCount,
  validateBreathCount,
} from "../services/physicsCalculationService";

type BreathingPaceScreenProps = {
  onBack: () => void;
  onLogResults: () => void;
  onSubmit: () => void;
  hasDraft?: boolean;
  activityId?: string;
  activityTitle?: string;
};

const RECORD_DURATION_SEC = 20;
const SAMPLE_INTERVAL_MS = 100;
const SCREEN_WIDTH = Dimensions.get("window").width;

type AttemptResult = {
  restSamples: number[];
  exerciseSamples: number[];
  restBpm: number;
  exerciseBpm: number;
  restBreathCount: number;
  exerciseBreathCount: number;
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
  const { colours, highContrast } = useAccessibility();

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
        <View
          style={[
            modalStyles.sheet,
            {
              backgroundColor: colours.card,
              borderColor: colours.border,
              borderTopWidth: highContrast ? 3 : 0,
            },
          ]}
        >
          <View style={modalStyles.header}>
            <Text
              style={[
                modalStyles.title,
                { color: colours.text, fontSize: 22 * colours.textScale },
              ]}
            >
              Attempt #{attemptNumber}
            </Text>
            <TouchableOpacity
              style={[
                modalStyles.closeBtn,
                {
                  backgroundColor: colours.background,
                  borderColor: colours.border,
                  borderWidth: highContrast ? 2 : 0,
                },
              ]}
              onPress={onClose}
            >
              <Text
                style={[
                  modalStyles.closeBtnText,
                  { color: colours.text, fontWeight: "700" },
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
            <View
              style={[
                modalStyles.bpmSummary,
                {
                  backgroundColor: colours.background,
                  borderColor: colours.border,
                  borderWidth: highContrast ? 3 : 1,
                },
              ]}
            >
              <View style={modalStyles.bpmCard}>
                <Text
                  style={[
                    modalStyles.bpmLabel,
                    {
                      color: colours.subText,
                      fontSize: 14 * colours.textScale,
                    },
                  ]}
                >
                  Rest BPM
                </Text>
                <Text
                  style={[
                    modalStyles.bpmValue,
                    {
                      color: colours.primary,
                      fontSize: 32 * colours.textScale,
                    },
                  ]}
                >
                  {attempt.restBpm}
                </Text>
              </View>
              <View style={modalStyles.bpmCard}>
                <Text
                  style={[
                    modalStyles.bpmLabel,
                    {
                      color: colours.subText,
                      fontSize: 14 * colours.textScale,
                    },
                  ]}
                >
                  Exercise BPM
                </Text>
                <Text
                  style={[
                    modalStyles.bpmValue,
                    {
                      color: colours.danger,
                      fontSize: 32 * colours.textScale,
                    },
                  ]}
                >
                  {attempt.exerciseBpm}
                </Text>
              </View>
            </View>

            <Text
              style={[
                modalStyles.chartLabel,
                { color: colours.text, fontSize: 15 * colours.textScale },
              ]}
            >
              Comparison
            </Text>
            <View style={modalStyles.chartContainer}>
              <ComparisonChart
                restSamples={attempt.restSamples}
                exerciseSamples={attempt.exerciseSamples}
                width={modalChartWidth}
                height={200}
              />
            </View>

            <Text
              style={[
                modalStyles.chartLabel,
                { color: colours.primary, fontSize: 15 * colours.textScale },
              ]}
            >
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

            <Text
              style={[
                modalStyles.chartLabel,
                { color: colours.danger, fontSize: 15 * colours.textScale },
              ]}
            >
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
              { backgroundColor: colours.primary, marginTop: 20 },
            ]}
            onPress={onClose}
          >
            <Text
              style={[
                modalStyles.doneBtnText,
                { color: "#ffffff", fontSize: 18 * colours.textScale },
              ]}
            >
              Close Analysis
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function BreathingPaceScreen({
  onBack,
  onSubmit,
  onLogResults,
  hasDraft,
}: BreathingPaceScreenProps) {
  const { colours, highContrast } = useAccessibility();

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

  const [displayBpm, setDisplayBpm] = useState<number | null>(null);
  const [restBpmSaved, setRestBpmSaved] = useState<number | null>(null);
  const [exerciseBpmSaved, setExerciseBpmSaved] = useState<number | null>(null);

  const isRecordingRef = useRef(false);
  const samplesRef = useRef<number[]>([]);
  const startTimeRef = useRef(0);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const breathCountRef = useRef(0);
  const restBreathCountRef = useRef(0);

  const breathingStateRef = useRef<BreathingDetectionState>(
    createBreathingDetectionState(),
  );

  const lastDisplayBpmRef = useRef<number | null>(null);

  const isRecordingActive =
    recordState === "recording_rest" || recordState === "recording_exercise";
  const currentColor = recordState.includes("rest")
    ? colours.primary
    : colours.danger;
  const currentLabel = recordState.includes("rest") ? "Rest" : "Exercise";
  const latestAttempt = attempts[attempts.length - 1] ?? null;

  const cardStyle = [
    styles.sensorCard,
    {
      backgroundColor: colours.card,
      borderColor: colours.border,
      borderWidth: highContrast ? 3 : 1,
    },
  ];

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
    if (recordState === "idle") {
      setDisplayBpm(null);
      setRestBpmSaved(null);
      setExerciseBpmSaved(null);
    } else if (recordState === "transition") {
      setDisplayBpm(null);
    }
  }, [recordState]);

  useEffect(() => {
    let sub: any;
    if (isRecordingActive) {
      Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
      sub = Accelerometer.addListener(({ z }) => {
        if (!isRecordingRef.current) return;

        const currentTime = Date.now();
        samplesRef.current = [...samplesRef.current, z];
        setLiveSamples([...samplesRef.current]);

        if (breathingStateRef.current.startTime === 0) {
          breathingStateRef.current.startTime = startTimeRef.current;
        }

        const result = processBreathingSample(
          breathingStateRef.current,
          z,
          currentTime,
        );

        if (result.breathCount !== breathCountRef.current) {
          breathCountRef.current = result.breathCount;
        }

        if (result.isBreathPeak) {
          if (result.currentBpm !== null && result.currentBpm > 0) {
            setDisplayBpm(result.currentBpm);
            lastDisplayBpmRef.current = result.currentBpm;
          } else {
            const elapsedSec = (currentTime - startTimeRef.current) / 1000;
            if (elapsedSec > 0 && result.breathCount > 0) {
              const bpm = (result.breathCount / elapsedSec) * 60;
              const clampedBpm = Math.min(45, Math.max(8, bpm));
              setDisplayBpm(clampedBpm);
              lastDisplayBpmRef.current = clampedBpm;
            }
          }
        }
      });
    }
    return () => sub?.remove();
  }, [isRecordingActive]);

  useEffect(() => {
    if (!isRecordingActive) return;

    const now = Date.now();
    startTimeRef.current = now;
    breathingStateRef.current.startTime = now;
    breathCountRef.current = 0;
    lastDisplayBpmRef.current = null;

    recordTimerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);

      if (secs > 0 && breathingStateRef.current.breathCount > 0) {
        const bpm = (breathingStateRef.current.breathCount / secs) * 60;
        const clampedBpm = Math.min(45, Math.max(5, bpm));
        const finalBpm = parseFloat(clampedBpm.toFixed(2));
        setDisplayBpm(finalBpm);
        lastDisplayBpmRef.current = finalBpm;
      }

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
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
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

    const now = Date.now();
    startTimeRef.current = now;

    resetBreathingDetectionState(breathingStateRef.current, now);
    breathCountRef.current = 0;
    setDisplayBpm(0);
    lastDisplayBpmRef.current = null;

    setRecordState((prev) =>
      prev === "countdown_rest" ? "recording_rest" : "recording_exercise",
    );
  }

  function stopRecording() {
    isRecordingRef.current = false;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);

    const savedSamples = [...samplesRef.current];
    const elapsedSec = Math.max(elapsed, 1);
    let savedBreathCount = breathingStateRef.current.breathCount;

    let validBreathCount = validateBreathCount(savedBreathCount, elapsedSec);

    if (validBreathCount !== savedBreathCount || savedBreathCount === 0) {
      validBreathCount = estimateBreathsFromSamples(
        savedSamples,
        SAMPLE_INTERVAL_MS,
      );
      validBreathCount = validateBreathCount(validBreathCount, elapsedSec);
    }

    let finalBpm =
      lastDisplayBpmRef.current !== null && lastDisplayBpmRef.current > 0
        ? lastDisplayBpmRef.current
        : calculateBpmFromBreathCount(validBreathCount, elapsedSec);

    finalBpm = Math.min(45, Math.max(5, finalBpm));
    setDisplayBpm(finalBpm);

    if (savedSamples.length < 10) {
      Alert.alert(
        "Insufficient Data",
        "Not enough sensor data collected. Please try again.",
      );
      setRecordState("idle");
      return;
    }

    if (recordState === "recording_rest") {
      restBreathCountRef.current = validBreathCount;
      setRestBpmSaved(finalBpm);
      setCurrentRestSamples(savedSamples);
      setRecordState("transition");
    } else if (recordState === "recording_exercise") {
      if (!currentRestSamples) {
        Alert.alert("Error", "Rest data missing. Please restart.");
        setRecordState("idle");
        return;
      }

      const restBpm =
        restBpmSaved ??
        calculateBpmFromBreathCount(restBreathCountRef.current, elapsedSec);
      setExerciseBpmSaved(finalBpm);

      const fullAttempt: AttemptResult = {
        restSamples: currentRestSamples,
        exerciseSamples: savedSamples,
        restBpm,
        exerciseBpm: finalBpm,
        restBreathCount: restBreathCountRef.current,
        exerciseBreathCount: validBreathCount,
      };

      setAttempts((prev) => [...prev, fullAttempt]);
      setRecordState("done");
      setCurrentRestSamples(null);
    }
  }

  function resetForNewAttempt() {
    setRecordState("idle");
    setDisplayBpm(null);
    setRestBpmSaved(null);
    setExerciseBpmSaved(null);
    setCurrentRestSamples(null);
    samplesRef.current = [];
    breathCountRef.current = 0;
    restBreathCountRef.current = 0;
    lastDisplayBpmRef.current = null;
  }

  const progressPct = Math.min(elapsed / RECORD_DURATION_SEC, 1);
  const timeLeft = Math.max(0, RECORD_DURATION_SEC - elapsed);

  const getCurrentBpmDisplay = () => {
    if (
      recordState === "recording_rest" ||
      recordState === "recording_exercise"
    ) {
      if (displayBpm !== null && displayBpm > 0) {
        return displayBpm;
      }
      return "-";
    }
    if (recordState === "done") {
      if (exerciseBpmSaved !== null) return exerciseBpmSaved;
      if (restBpmSaved !== null) return restBpmSaved;
    }
    if (recordState === "transition" && restBpmSaved !== null) {
      return restBpmSaved;
    }
    return "-";
  };

  return (
    <>
      <ScrollView
        style={[styles.scrollContainer, { backgroundColor: colours.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.phoneFrame, { backgroundColor: colours.background }]}
        >
          <Text
            style={[
              styles.headerTitle,
              { color: colours.text, fontSize: 22 * colours.textScale },
            ]}
          >
            Breathing Pace Trainer
          </Text>

          <View style={cardStyle}>
            <Text
              style={[
                styles.cardHeader,
                { color: colours.subText, fontSize: 18 * colours.textScale },
              ]}
            >
              Live Sensor Data
            </Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricColumn}>
                <Text
                  style={[
                    styles.metricValue,
                    { color: currentColor, fontSize: 26 * colours.textScale },
                  ]}
                >
                  {recordState === "idle" || recordState === "done"
                    ? "-"
                    : currentLabel}
                </Text>
                <Text
                  style={[
                    styles.metricLabel,
                    { color: colours.text, fontSize: 14 * colours.textScale },
                  ]}
                >
                  Phase
                </Text>
              </View>
              <View style={styles.metricColumn}>
                <Text
                  style={[
                    styles.metricValue,
                    { color: currentColor, fontSize: 26 * colours.textScale },
                  ]}
                >
                  {getCurrentBpmDisplay()}
                </Text>
                <Text
                  style={[
                    styles.metricLabel,
                    { color: colours.text, fontSize: 14 * colours.textScale },
                  ]}
                >
                  Breaths/min
                </Text>
              </View>
              <View style={styles.metricColumn}>
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: colours.primary,
                      fontSize: 14 * colours.textScale,
                    },
                    isRecordingActive && { color: colours.danger },
                    recordState === "done" && { color: colours.success },
                    recordState.includes("countdown") && {
                      color: colours.danger,
                    },
                    recordState === "transition" && { color: colours.success },
                  ]}
                >
                  {isRecordingActive
                    ? `${timeLeft}s`
                    : recordState.includes("countdown")
                      ? `${countdown}s`
                      : recordState === "transition"
                        ? "READY"
                        : "SENSOR\nACTIVE"}
                </Text>
              </View>
            </View>
          </View>

          {isRecordingActive && (
            <View style={[cardStyle, { paddingBottom: 20 }]}>
              <Text
                style={[
                  styles.cardHeader,
                  { color: colours.subText, fontSize: 18 * colours.textScale },
                ]}
              >
                Live Sensor Data • {currentLabel}
              </Text>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colours.border },
                ]}
              >
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
            <View style={[cardStyle, { paddingBottom: 20 }]}>
              <Text
                style={[
                  styles.cardHeader,
                  { color: colours.subText, fontSize: 18 * colours.textScale },
                ]}
              >
                Comparison - Results
              </Text>
              <View
                style={[
                  styles.resultsSummary,
                  {
                    backgroundColor: colours.background,
                    borderColor: colours.border,
                    borderWidth: highContrast ? 3 : 1,
                  },
                ]}
              >
                <View style={styles.resultCard}>
                  <Text
                    style={[
                      styles.resultLabel,
                      {
                        color: colours.subText,
                        fontSize: 12 * colours.textScale,
                      },
                    ]}
                  >
                    Rest BPM
                  </Text>
                  <Text
                    style={[
                      styles.resultValue,
                      {
                        color: colours.primary,
                        fontSize: 24 * colours.textScale,
                      },
                    ]}
                  >
                    {latestAttempt.restBpm}
                  </Text>
                </View>
                <View style={styles.resultCard}>
                  <Text
                    style={[
                      styles.resultLabel,
                      {
                        color: colours.subText,
                        fontSize: 12 * colours.textScale,
                      },
                    ]}
                  >
                    Exercise BPM
                  </Text>
                  <Text
                    style={[
                      styles.resultValue,
                      {
                        color: colours.danger,
                        fontSize: 24 * colours.textScale,
                      },
                    ]}
                  >
                    {latestAttempt.exerciseBpm}
                  </Text>
                </View>
                <View style={styles.resultCard}>
                  <Text
                    style={[
                      styles.resultLabel,
                      {
                        color: colours.subText,
                        fontSize: 12 * colours.textScale,
                      },
                    ]}
                  >
                    Difference
                  </Text>
                  <Text
                    style={[
                      styles.resultValue,
                      { color: colours.text, fontSize: 24 * colours.textScale },
                    ]}
                  >
                    Δ
                    {Math.abs(
                      latestAttempt.exerciseBpm - latestAttempt.restBpm,
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendLine,
                      { backgroundColor: colours.primary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      { color: colours.text, fontSize: 12 * colours.textScale },
                    ]}
                  >
                    Rest
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendLine,
                      { backgroundColor: colours.danger },
                    ]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      { color: colours.text, fontSize: 12 * colours.textScale },
                    ]}
                  >
                    Post-Exercise
                  </Text>
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
            <View style={[cardStyle, { height: 300 }]}>
              <Text
                style={[
                  styles.cardHeader,
                  { color: colours.subText, fontSize: 20 * colours.textScale },
                ]}
              >
                Rest Breathing Pace
              </Text>
              <Text
                style={[
                  styles.instructStep,
                  { color: colours.text, fontSize: 18 * colours.textScale },
                ]}
              >
                1. Lie stationary on a flat surface.
              </Text>
              <Text
                style={[
                  styles.instructStep,
                  { color: colours.text, fontSize: 18 * colours.textScale },
                ]}
              >
                2. Place device with Side Quest app over your chest.
              </Text>
              <Text
                style={[
                  styles.instructStep,
                  { color: colours.text, fontSize: 18 * colours.textScale },
                ]}
              >
                3. Breathe normally for {RECORD_DURATION_SEC} seconds. {"\n"}
              </Text>
              <Text
                style={[
                  styles.instructStep,
                  {
                    color: colours.subText,
                    fontSize: 14 * colours.textScale,
                    marginTop: 10,
                  },
                ]}
              >
                Expected range: 12-20 Breaths/min resting
              </Text>
            </View>
          )}

          {recordState === "transition" && restBpmSaved !== null && (
            <View style={cardStyle}>
              <Text
                style={[
                  styles.cardHeader,
                  { color: colours.subText, fontSize: 18 * colours.textScale },
                ]}
              >
                Post-Exercise Breathing Pace
              </Text>
              <View
                style={[
                  styles.savedBpmCard,
                  {
                    backgroundColor: colours.background,
                    borderColor: colours.border,
                    borderWidth: highContrast ? 3 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.savedBpmLabel,
                    { color: colours.text, fontSize: 16 * colours.textScale },
                  ]}
                >
                  Resting BPM:
                </Text>
                <Text
                  style={[
                    styles.savedBpmValue,
                    {
                      color: colours.primary,
                      fontSize: 28 * colours.textScale,
                    },
                  ]}
                >
                  {restBpmSaved}
                </Text>
              </View>

              <Text
                style={[
                  styles.instructStep,
                  { color: colours.text, fontSize: 18 * colours.textScale },
                ]}
              >
                1. Perform light exercise (jumping jacks, running in place,
                etc.)
              </Text>
              <Text
                style={[
                  styles.instructStep,
                  { color: colours.text, fontSize: 18 * colours.textScale },
                ]}
              >
                2. Immediately resume the flat positioning.
              </Text>
              <Text
                style={[
                  styles.instructStep,
                  { color: colours.text, fontSize: 18 * colours.textScale },
                ]}
              >
                3. Place the device on your chest and press Continue
              </Text>
            </View>
          )}

          {recordState.includes("countdown") && (
            <View style={[cardStyle, { height: 300 }]}>
              <Text
                style={[
                  styles.cardHeader,
                  { color: colours.subText, fontSize: 18 * colours.textScale },
                ]}
              >
                Starting in..
              </Text>
              <View style={{ alignItems: "center", marginVertical: 10 }}>
                <Text
                  style={[
                    styles.metricValue,
                    {
                      fontSize: 54 * colours.textScale,
                      color: colours.primary,
                    },
                  ]}
                >
                  {countdown}
                </Text>
                <Text
                  style={[
                    styles.metricLabel,
                    { color: colours.text, fontSize: 14 * colours.textScale },
                  ]}
                >
                  Keep the phone centered and steady
                </Text>
              </View>
            </View>
          )}

          {attempts.length > 0 && (
            <View style={cardStyle}>
              <Text
                style={[
                  styles.cardHeader,
                  { color: colours.subText, fontSize: 18 * colours.textScale },
                ]}
              >
                Previous Attempts
              </Text>
              {attempts.map((a, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.attemptRow,
                    { borderTopColor: colours.border },
                  ]}
                  onPress={() => setModalAttempt({ attempt: a, idx })}
                >
                  <Text
                    style={[
                      styles.attemptIndex,
                      {
                        color: colours.primary,
                        fontSize: 16 * colours.textScale,
                      },
                    ]}
                  >
                    #{idx + 1}
                  </Text>
                  <View style={styles.attemptDetails}>
                    <Text
                      style={[
                        styles.attemptMovement,
                        {
                          color: colours.text,
                          fontSize: 14 * colours.textScale,
                        },
                      ]}
                    >
                      Attempt {idx + 1}
                    </Text>
                    <Text
                      style={[
                        styles.attemptStat,
                        {
                          color: colours.subText,
                          fontSize: 11 * colours.textScale,
                        },
                      ]}
                    >
                      Rest: {a.restBpm} bpm • Post-Exercise: {a.exerciseBpm} bpm
                      • Δ{Math.abs(a.exerciseBpm - a.restBpm).toFixed(2)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.attemptChevron,
                      { color: colours.text, fontSize: 24 * colours.textScale },
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {recordState === "idle" && (
            <TouchableOpacity
              style={[styles.trackingButton, { backgroundColor: colours.primary }]}
              onPress={() => setRecordState("countdown_rest")}
            >
              <Text
                style={[
                  styles.trackingButtonText,
                  { color: "#ffffff", fontSize: 18 * colours.textScale },
                ]}
              >
                Start Rest Recording
              </Text>
            </TouchableOpacity>
          )}

          {recordState === "transition" && (
            <TouchableOpacity
              style={[styles.trackingButton, { backgroundColor: colours.primary }]}
              onPress={() => setRecordState("countdown_exercise")}
            >
              <Text
                style={[
                  styles.trackingButtonText,
                  { color: "#ffffff", fontSize: 18 * colours.textScale },
                ]}
              >
                Continue to Exercise
              </Text>
            </TouchableOpacity>
          )}

          {isRecordingActive && (
            <TouchableOpacity
              style={[styles.trackingButton, { backgroundColor: colours.danger }]}
              onPress={stopRecording}
            >
              <Text
                style={[
                  styles.trackingButtonText,
                  { color: "#ffffff", fontSize: 18 * colours.textScale },
                ]}
              >
                Stop Recording
              </Text>
            </TouchableOpacity>
          )}

          {recordState === "done" && (
            <TouchableOpacity
              style={[styles.trackingButton, { backgroundColor: colours.success }]}
              onPress={resetForNewAttempt}
            >
              <Text
                style={[
                  styles.trackingButtonText,
                  { color: "#ffffff", fontSize: 18 * colours.textScale },
                ]}
              >
                New Attempt
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.logButton,
              {
                backgroundColor: colours.card,
                borderColor: colours.border,
                borderWidth: highContrast ? 3 : 2,
              },
            ]}
            onPress={onLogResults}
          >
            <View style={styles.logButtonContent}>
              <Text
                style={[
                  styles.logButtonText,
                  { color: colours.text, fontSize: 20 * colours.textScale },
                ]}
              >
                Log Results
              </Text>
              <Text
                style={[
                  styles.arrowIcon,
                  { color: colours.text, fontSize: 20 * colours.textScale },
                ]}
              >
                ➔
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={[
                styles.quitButton,
                {
                  backgroundColor: colours.danger,
                  borderColor: colours.border,
                  borderWidth: highContrast ? 3 : 2,
                },
              ]}
              onPress={onBack}
            >
              <Text
                style={[
                  styles.bottomButtonText,
                  { color: "#ffffff", fontSize: 24 * colours.textScale },
                ]}
              >
                Quit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: colours.success,
                  borderColor: colours.border,
                  borderWidth: highContrast ? 3 : 2,
                },
                attempts.length === 0 && styles.disabledButton,
              ]}
              onPress={attempts.length > 0 ? onSubmit : undefined}
            >
              <Text
                style={[
                  styles.bottomButtonText,
                  { color: colours.text, fontSize: 24 * colours.textScale },
                ]}
              >
                Submit
              </Text>
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
    fontWeight: "600",
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
    marginBottom: 20,
  },
  trackingButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "600" },
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
  disabledButton: {
    opacity: 0.5,
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
    marginTop:40
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
  resultsSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
  },
  resultCard: {
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000000",
  },
  savedBpmCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  savedBpmLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  savedBpmValue: {
    fontSize: 28,
    fontWeight: "800",
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
  bpmSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
  },
  bpmCard: {
    alignItems: "center",
  },
  bpmLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 4,
  },
  bpmValue: {
    fontSize: 32,
    fontWeight: "800",
  },
});