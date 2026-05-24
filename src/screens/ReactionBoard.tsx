import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, G, Line } from "react-native-svg";
import { calculateReactionResult } from "../services/physicsCalculationService";

type ReactionBoardScreenProps = {
  onBack: () => void;
  onSubmit: () => void;
};

const TRACE_RADIUS = 100;
const TOLERANCE = 28; // px band around the circle that counts as "on track"

type Phase = "phase1" | "phase2" | "phase3";
type TapState = "idle" | "waiting" | "ready" | "tapped" | "toosoon";

type Point = { x: number; y: number };

type ReactionAttempt = {
  phase: Phase;
  reactionTimeMs: number;
};

type TracingAttempt = {
  accuracyPercent: number;
  durationMs: number;
};

// ─────────────────────────────────────────────
// TraceCanvas - completely self-contained SVG drawing component.
// Uses pageX/pageY + measured canvas origin so touch coords are always
// relative to this exact view, even when the finger leaves its bounds.
// ─────────────────────────────────────────────
type TraceCanvasProps = {
  active: boolean;
  dotAngle: number;
  onPathUpdate: (path: Point[]) => void;
  onFinish: (path: Point[], size: number) => void;
};

function TraceCanvas({
  active,
  dotAngle,
  onPathUpdate,
  onFinish,
}: TraceCanvasProps) {
  const [size, setSize] = useState(0);
  const pathRef = useRef<Point[]>([]);
  const [renderPath, setRenderPath] = useState<Point[]>([]);
  const activeRef = useRef(active);
  const sizeRef = useRef(0);
  // Absolute page position of the canvas view - measured after layout
  const canvasOriginRef = useRef<{ px: number; py: number }>({ px: 0, py: 0 });
  const viewRef = useRef<View>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const cx = size / 2;
  const cy = size / 2;
  const movingX = cx + TRACE_RADIUS * Math.cos((dotAngle * Math.PI) / 180);
  const movingY = cy + TRACE_RADIUS * Math.sin((dotAngle * Math.PI) / 180);

  // Guide circle points
  const guidePoints: Point[] = Array.from({ length: 60 }, (_, i) => ({
    x: cx + TRACE_RADIUS * Math.cos(((i / 60) * 360 * Math.PI) / 180),
    y: cy + TRACE_RADIUS * Math.sin(((i / 60) * 360 * Math.PI) / 180),
  }));

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const s = e.nativeEvent.layout.width;
    setSize(s);
    sizeRef.current = s;
    // Measure absolute page position so we can convert pageX/pageY → local coords
    viewRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      canvasOriginRef.current = { px: pageX, py: pageY };
    });
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => activeRef.current,
      onMoveShouldSetPanResponder: () => activeRef.current,
      // Capture so the ScrollView never steals the gesture mid-draw
      onStartShouldSetPanResponderCapture: () => activeRef.current,
      onMoveShouldSetPanResponderCapture: () => activeRef.current,

      onPanResponderGrant: (e) => {
        if (!activeRef.current) return;
        const s = sizeRef.current;
        // Convert absolute page coords to canvas-local coords
        const x = e.nativeEvent.pageX - canvasOriginRef.current.px;
        const y = e.nativeEvent.pageY - canvasOriginRef.current.py;
        // Reject if touch starts outside the canvas
        if (x < 0 || y < 0 || x > s || y > s) return;
        pathRef.current = [{ x, y }];
        setRenderPath([{ x, y }]);
        onPathUpdate([{ x, y }]);
      },

      onPanResponderMove: (e) => {
        if (!activeRef.current) return;
        const s = sizeRef.current;
        // Always convert from page coords - reliable even when finger leaves view
        const x = e.nativeEvent.pageX - canvasOriginRef.current.px;
        const y = e.nativeEvent.pageY - canvasOriginRef.current.py;
        // Strictly drop any point outside the canvas bounds
        if (x < 0 || y < 0 || x > s || y > s) return;
        const next = [...pathRef.current, { x, y }];
        pathRef.current = next;
        setRenderPath(next);
        onPathUpdate(next);
      },

      onPanResponderRelease: () => {
        onFinish(pathRef.current, sizeRef.current);
        pathRef.current = [];
        setRenderPath([]);
      },
      onPanResponderTerminate: () => {
        onFinish(pathRef.current, sizeRef.current);
        pathRef.current = [];
        setRenderPath([]);
      },
    }),
  ).current;

  return (
    <View
      ref={viewRef}
      style={styles.traceArea}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {size > 0 && (
        <Svg width={size} height={size}>
          {/* Guide circle as individual small dots */}
          <G>
            {guidePoints
              .filter((_, i) => i % 3 === 0)
              .map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={2} fill="none" />
              ))}
          </G>

          {/* User's drawn path as connected line segments */}
          {renderPath.length > 1 &&
            renderPath
              .slice(0, -1)
              .map((p, i) => (
                <Line
                  key={i}
                  x1={p.x}
                  y1={p.y}
                  x2={renderPath[i + 1].x}
                  y2={renderPath[i + 1].y}
                  stroke="#1d5db1"
                  strokeWidth={4}
                  strokeLinecap="round"
                  opacity={0.65}
                />
              ))}

          {/* Moving red target dot */}
          {active && (
            <Circle
              cx={movingX}
              cy={movingY}
              r={32}
              fill="#dc2626"
              opacity={0.9}
            />
          )}
        </Svg>
      )}
    </View>
  );
}

export default function ReactionBoardScreen({
  onBack,
  onSubmit,
}: ReactionBoardScreenProps) {
  const [phase, setPhase] = useState<Phase>("phase1");

  const [tapState, setTapState] = useState<TapState>("idle");
  const [reactionTimeMs, setReactionTimeMs] = useState(0);
  const [reactionStatus, setReactionStatus] = useState("PRESS START");
  const [reactionAttempts, setReactionAttempts] = useState<ReactionAttempt[]>(
    [],
  );
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [traceActive, setTraceActive] = useState(false);
  const [dotAngle, setDotAngle] = useState(0);
  const [tracingAttempts, setTracingAttempts] = useState<TracingAttempt[]>([]);
  const [traceStatus, setTraceStatus] = useState("PRESS START");
  const [lastAccuracy, setLastAccuracy] = useState(0);
  const [canvasKey, setCanvasKey] = useState(0);

  const dotAngleRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const traceStartRef = useRef<number>(0);
  const traceActiveRef = useRef(false);

  useEffect(() => {
    traceActiveRef.current = traceActive;
  }, [traceActive]);

  useEffect(() => {
    if (!traceActive) return;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      dotAngleRef.current = (dotAngleRef.current + (90 * delta) / 1000) % 360;
      setDotAngle(dotAngleRef.current);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [traceActive]);

  const handlePathUpdate = useCallback((_path: Point[]) => {}, []);

  const handleFinish = useCallback((path: Point[], canvasSize: number) => {
    cancelAnimationFrame(animFrameRef.current);
    setTraceActive(false);
    traceActiveRef.current = false;

    const total = path.length;
    if (total === 0) return;

    const cx = canvasSize / 2;
    const cy = canvasSize / 2;

    const accurate = path.filter(({ x, y }) => {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      return Math.abs(dist - TRACE_RADIUS) < TOLERANCE;
    }).length;

    const accuracyPercent = Math.round((accurate / total) * 100);
    const durationMs = Date.now() - traceStartRef.current;

    calculateReactionResult({ accuracyPercent, durationMs }).then((result) => {
      setLastAccuracy(result.accuracyPercent);
      setTraceStatus(result.traceStatus);
      setTracingAttempts((prev) => [...prev, result]);
    });
  }, []);

  const handleStartTrace = useCallback(() => {
    dotAngleRef.current = 0;
    setDotAngle(0);
    setTraceStatus("TRACING");
    traceStartRef.current = Date.now();
    setCanvasKey((k) => k + 1);
    traceActiveRef.current = true;
    setTraceActive(true);
  }, []);

  const startReaction = () => {
    setTapState("waiting");
    setReactionStatus("WAIT...");
    const delay = Math.floor(Math.random() * 2500) + 1500;
    timeoutRef.current = setTimeout(() => {
      setTapState("ready");
      startTimeRef.current = Date.now();
      setReactionStatus("TAP NOW!");
    }, delay);
  };

  const handleTap = () => {
    if (tapState === "idle") return;
    if (tapState === "waiting") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setTapState("toosoon");
      setReactionStatus("TOO SOON!");

      return;
    }
    if (tapState === "ready") {
      const elapsed = Date.now() - startTimeRef.current;
      calculateReactionResult({ reactionTimeMs: elapsed }).then((result) => {
        setReactionTimeMs(result.reactionTimeMs);
        setReactionStatus(result.reactionStatus);
        setTapState("tapped");
        setReactionAttempts((prev) => [
          ...prev,
          { phase, reactionTimeMs: result.reactionTimeMs },
        ]);
      });
    }
  };

  const tapButtonColor =
    tapState === "ready"
      ? "#16a34a"
      : tapState === "toosoon"
        ? "#dc2626"
        : tapState === "tapped"
          ? "#1d5db1"
          : "#d3d3d3";

  const currentPhaseAttempts = reactionAttempts.filter(
    (a) => a.phase === phase,
  );

  const avgReaction = (arr: ReactionAttempt[]) =>
    arr.length === 0
      ? null
      : Math.round(arr.reduce((s, a) => s + a.reactionTimeMs, 0) / arr.length);

  const p1Attempts = reactionAttempts.filter((a) => a.phase === "phase1");
  const p2Attempts = reactionAttempts.filter((a) => a.phase === "phase2");

  return (
    <ScrollView
      style={styles.outerContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.phoneFrame}>
        <Text style={styles.headerTitle}>Reaction Board Challenge</Text>

        <View style={styles.phaseRow}>
          {(["phase1", "phase2", "phase3"] as Phase[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.phaseTab, phase === p && styles.phaseTabActive]}
              onPress={() => {
                setPhase(p);
                setTapState("idle");
                setReactionStatus("PRESS START");
                traceActiveRef.current = false;
                setTraceActive(false);
                setTraceStatus("PRESS START");
                setCanvasKey((k) => k + 1);
                pulseAnim.setValue(1);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                cancelAnimationFrame(animFrameRef.current);
              }}
            >
              <Text
                style={[
                  styles.phaseTabText,
                  phase === p && styles.phaseTabTextActive,
                ]}
              >
                {p === "phase1"
                  ? "Dominant"
                  : p === "phase2"
                    ? "Non-Dominant"
                    : "Tracing"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {(phase === "phase1" || phase === "phase2") && (
          <>
            <View style={styles.sensorCard}>
              <Text style={styles.cardHeader}>
                {phase === "phase1"
                  ? "Tap Reaction (Dominant Hand)"
                  : "Swap Hands (Non-Dominant)"}
              </Text>
              <View style={styles.metricsRow}>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricValue}>
                    {reactionTimeMs > 0 ? `${reactionTimeMs}ms` : "-"}
                  </Text>
                  <Text style={styles.metricLabel}>Reaction</Text>
                </View>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricValue}>
                    {currentPhaseAttempts.length}
                  </Text>
                  <Text style={styles.metricLabel}>Attempts</Text>
                </View>
                <View style={styles.metricColumn}>
                  <Text
                    style={[
                      styles.statusText,
                      reactionStatus === "TAP NOW!" && { color: "#16a34a" },
                      reactionStatus === "TOO SOON!" && { color: "#dc2626" },
                    ]}
                  >
                    {reactionStatus}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={tapState === "idle" ? undefined : handleTap}
              activeOpacity={tapState === "idle" ? 1 : 0.85}
            >
              <View
                style={[
                  styles.reactionButton,
                  { backgroundColor: tapButtonColor },
                ]}
              >
                <Text style={styles.reactionButtonText}>
                  {tapState === "idle"
                    ? "-"
                    : tapState === "waiting"
                      ? "Wait..."
                      : tapState === "ready"
                        ? "TAP"
                        : tapState === "toosoon"
                          ? "Too soon!"
                          : "✓"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.trackingButton}
              onPress={startReaction}
            >
              <Text style={styles.trackingButtonText}>Start</Text>
            </TouchableOpacity>

            {currentPhaseAttempts.length > 0 && (
              <View style={styles.sensorCard}>
                <Text style={styles.cardHeader}>
                  Attempts •{" "}
                  <Text style={{ color: "#1d5db1" }}>
                    Avg: {avgReaction(currentPhaseAttempts)}ms
                  </Text>
                </Text>
                {currentPhaseAttempts.map((a, i) => (
                  <View key={i} style={styles.attemptRow}>
                    <Text style={styles.attemptIndex}>#{i + 1}</Text>
                    <Text style={styles.attemptDetail}>
                      {a.phase === "phase1" ? "Dominant" : "Non-dominant"} hand
                    </Text>
                    <Text style={styles.attemptTime}>{a.reactionTimeMs}ms</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {phase === "phase3" && (
          <>
            <View style={styles.sensorCard}>
              <Text style={styles.cardHeader}>Tracing Challenge</Text>
              <View style={styles.metricsRow}>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricValue}>
                    {lastAccuracy > 0 ? `${lastAccuracy}%` : "-"}
                  </Text>
                  <Text style={styles.metricLabel}>Accuracy</Text>
                </View>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricValue}>
                    {tracingAttempts.length}
                  </Text>
                  <Text style={styles.metricLabel}>Attempts</Text>
                </View>
                <View style={styles.metricColumn}>
                  <Text
                    style={[
                      styles.statusText,
                      traceStatus === "TRACING" && { color: "#16a34a" },
                      traceStatus === "POOR" && { color: "#dc2626" },
                    ]}
                  >
                    {traceStatus}
                  </Text>
                </View>
              </View>
            </View>

            {/* TraceCanvas is fully self-contained - owns its own touch handling and SVG */}
            <TraceCanvas
              key={canvasKey}
              active={traceActive}
              dotAngle={dotAngle}
              onPathUpdate={handlePathUpdate}
              onFinish={handleFinish}
            />

            <TouchableOpacity
              style={styles.trackingButton}
              onPress={handleStartTrace}
            >
              <Text style={styles.trackingButtonText}>
                {traceActive ? "Tracing..." : "Start Trace"}
              </Text>
            </TouchableOpacity>

            {tracingAttempts.length > 0 && (
              <View style={styles.sensorCard}>
                <Text style={styles.cardHeader}>Tracing Attempts</Text>
                {tracingAttempts.map((a, i) => (
                  <View key={i} style={styles.attemptRow}>
                    <Text style={styles.attemptIndex}>#{i + 1}</Text>
                    <Text style={styles.attemptDetail}>
                      {a.durationMs}ms duration
                    </Text>
                    <Text style={styles.attemptTime}>{a.accuracyPercent}%</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.sensorCard}>
          <Text style={styles.cardHeader}>Hand Comparison</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricColumn}>
              <Text style={styles.metricValue}>
                {avgReaction(p1Attempts) || 0}ms
              </Text>
              <Text style={styles.metricLabel}>Dominant</Text>
            </View>
            <View style={styles.metricColumn}>
              <Text style={styles.metricValue}>
                {avgReaction(p2Attempts) || 0}ms
              </Text>
              <Text style={styles.metricLabel}>Non-Dominant</Text>
            </View>
            <View style={styles.metricColumn}>
              <Text style={[styles.metricValue, { color: "#ee8003" }]}>
                {Math.abs(
                  avgReaction(p1Attempts)! - avgReaction(p2Attempts)!,
                ) || 0}
                ms
              </Text>
              <Text style={styles.metricLabel}>Difference</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logButton}>
          <View style={styles.logButtonContent}>
            <Text style={styles.logButtonText}>Log Results</Text>
            <Text style={styles.arrowIcon}>➔</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.quitButton} onPress={onBack}>
            <Text style={styles.bottomButtonText}>Quit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
            <Text style={styles.bottomButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
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
  phaseRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  phaseTab: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  phaseTabActive: {
    borderColor: "#1d5db1",
    backgroundColor: "#eff6ff",
  },
  phaseTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666666",
  },
  phaseTabTextActive: {
    color: "#1d5db1",
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
    marginBottom: 24,
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
    color: "#1d5db1",
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
    color: "#1d5db1",
    textAlign: "center",
    width: 85,
    lineHeight: 20,
  },
  reactionButton: {
    height: 300,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  reactionButtonText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#ffffff",
  },
  traceArea: {
    width: "100%",
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 24,
    backgroundColor: "#f8fafc",
    marginBottom: 20,
    overflow: "hidden",
  },
  attemptRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 10,
  },
  attemptIndex: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1d5db1",
    width: 28,
  },
  attemptDetail: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  attemptTime: {
    fontSize: 14,
    fontWeight: "800",
    color: "#16a34a",
    width: 70,
    textAlign: "right",
  },
  trackingButton: {
    backgroundColor: "#1d5db1",
    borderRadius: 14,
    height: 56,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,
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
