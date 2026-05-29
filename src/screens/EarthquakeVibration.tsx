import { Accelerometer } from "expo-sensors";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ScrollView,
} from "react-native";
import { calculateSeismicVibration } from "../services/physicsCalculationService";
import { LineChart } from "react-native-chart-kit";
import { useAccessibility } from "../../context/AccessibilityContext";

type EarthquakeDetectionScreenProps = {
  onBack: () => void;
  onLogResults: () => void;
  onSubmit: () => void;
  hasDraft?: boolean;
  activityId?: string;
  activityTitle?: string;
};

type EarthquakeAttempt = {
  id: number;
  peakPGA: number;
  avgPGA: number;
  mmiLevel: string;
  timestamp: Date;
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const ATTEMPT_DURATION_SEC = 20;

export default function EarthquakeDetectionScreen({
  onBack,
  onSubmit,
  onLogResults,
}: EarthquakeDetectionScreenProps) {
  const { colours, highContrast } = useAccessibility();

  
  const [isAttemptActive, setIsAttemptActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(ATTEMPT_DURATION_SEC);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  
  const [pga, setPga] = useState(0.0);
  const [mmiLevel, setMmiLevel] = useState("I");
  const [status, setStatus] = useState("SENSOR ACTIVE");
  const [pgaHistory, setPgaHistory] = useState<number[]>([0, 0, 0, 0, 0]);

  
  const [earthquakeAttempts, setEarthquakeAttempts] = useState<EarthquakeAttempt[]>([]);
  const peakPGARef = useRef(0);
  const peakMMIRef = useRef("I");
  const subscriptionRef = useRef<any>(null);

  
  const pgaSumRef = useRef(0);
  const pgaCountRef = useRef(0);

  const cardStyle = [
    styles.sensorCard,
    {
      backgroundColor: colours.card,
      borderColor: colours.border,
      borderWidth: highContrast ? 3 : 1,
    },
  ];

  
  const stopSensor = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  };

  
  const startAttempt = async () => {
    if (isAttemptActive) return;

    const available = await Accelerometer.isAvailableAsync();
    if (!available) {
      Alert.alert("Error", "Accelerometer sensor is unavailable on this device.");
      return;
    }

    
    setPga(0);
    setMmiLevel("I");
    setStatus("RECORDING");
    setPgaHistory([0, 0, 0, 0, 0]);
    peakPGARef.current = 0;
    peakMMIRef.current = "I";
    pgaSumRef.current = 0;
    pgaCountRef.current = 0;
    setRemainingSeconds(ATTEMPT_DURATION_SEC);

    
    Accelerometer.setUpdateInterval(100);
    subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
      calculateSeismicVibration({ x, y, z }).then((result) => {
        const currentPga = result.accelMagnitude;
        setPga(currentPga);
        setStatus(result.seismicStatus);

        
        pgaSumRef.current += currentPga;
        pgaCountRef.current += 1;

        
        if (currentPga > peakPGARef.current) {
          peakPGARef.current = currentPga;
          let newMmi = "I";
          if (currentPga > 0.8) newMmi = "VIII";
          else if (currentPga > 0.34) newMmi = "VI";
          else if (currentPga > 0.12) newMmi = "IV";
          else if (currentPga > 0.02) newMmi = "II";
          peakMMIRef.current = newMmi;
          setMmiLevel(newMmi);
        }

        
        setPgaHistory((prev) => {
          const updated = [...prev, currentPga];
          if (updated.length > 10) updated.shift();
          return updated;
        });
      });
    });

    setIsAttemptActive(true);

    
    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          finishAttempt();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishAttempt = () => {
    
    stopSensor();
    setIsAttemptActive(false);
    setStatus("SENSOR ACTIVE");

    
    const avgPGA = pgaCountRef.current > 0 ? pgaSumRef.current / pgaCountRef.current : 0;

    
    const newAttempt: EarthquakeAttempt = {
      id: Date.now(),
      peakPGA: peakPGARef.current,
      avgPGA: avgPGA,
      mmiLevel: peakMMIRef.current,
      timestamp: new Date(),
    };
    setEarthquakeAttempts((prev) => [newAttempt, ...prev]);

    
    setPga(peakPGARef.current);
    setMmiLevel(peakMMIRef.current);
  };

  const cancelAttempt = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopSensor();
    setIsAttemptActive(false);
    setStatus("SENSOR ACTIVE");
    setPga(0);
    setMmiLevel("I");
    setPgaHistory([0, 0, 0, 0, 0]);
    setRemainingSeconds(ATTEMPT_DURATION_SEC);
    pgaSumRef.current = 0;
    pgaCountRef.current = 0;
    peakPGARef.current = 0;
  };

  
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSensor();
    };
  }, []);

  const maxPgaRecord = pgaHistory.length > 0 ? Math.max(...pgaHistory) : 0;

  return (
    <ScrollView
      style={[styles.outerContainer, { backgroundColor: colours.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.phoneFrame, { backgroundColor: colours.background }]}>
        <Text
          style={[
            styles.headerTitle,
            { color: colours.text, fontSize: 22 * colours.textScale },
          ]}
        >
          Earthquake-Resistant Structure
        </Text>

        <View style={cardStyle}>
          <Text
            style={[
              styles.cardHeader,
              { color: colours.subText, fontSize: 18 * colours.textScale },
            ]}
          >
            {isAttemptActive ? "Live Sensor Data" : "Last result"}
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricColumn}>
              <Text
                style={[
                  styles.metricValue,
                  { color: colours.primary, fontSize: 26 * colours.textScale },
                ]}
              >
                {pga.toFixed(2)}g
              </Text>
              <Text
                style={[
                  styles.metricLabel,
                  { color: colours.text, fontSize: 14 * colours.textScale },
                ]}
              >
                PGA
              </Text>
            </View>

            <View style={styles.metricColumn}>
              <Text
                style={[
                  styles.metricValue,
                  { color: colours.primary, fontSize: 26 * colours.textScale },
                ]}
              >
                {mmiLevel}
              </Text>
              <Text
                style={[
                  styles.metricLabel,
                  { color: colours.text, fontSize: 14 * colours.textScale },
                ]}
              >
                MMI
              </Text>
            </View>

            <View style={styles.metricColumn}>
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isAttemptActive ? colours.success : colours.primary,
                    fontSize: 14 * colours.textScale,
                  },
                ]}
              >
                {isAttemptActive ? `${remainingSeconds}s left` : status}
              </Text>
            </View>
          </View>
        </View>

        <View style={[cardStyle, { paddingBottom: 0 }]}>
          <Text
            style={[
              styles.cardHeader,
              { color: colours.subText, fontSize: 18 * colours.textScale },
            ]}
          >
            PGA Chart (g)
          </Text>
          <Text
            style={[
              styles.cardHeader,
              {
                fontSize: 14 * colours.textScale,
                color: colours.danger,
                fontWeight: "700",
              },
            ]}
          >
            {maxPgaRecord > 0 ? `Peak: ${maxPgaRecord.toFixed(2)}g` : ""}
          </Text>
          <LineChart
            data={{
              labels: [],
              datasets: [{ data: pgaHistory }],
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
              color: (opacity = 1) => colours.primary,
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
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>

        {!isAttemptActive ? (
          <TouchableOpacity
            style={[styles.trackingButton, { backgroundColor: colours.primary }]}
            onPress={startAttempt}
          >
            <Text
              style={[
                styles.trackingButtonText,
                { color: "#ffffff", fontSize: 20 * colours.textScale },
              ]}
            >
              Start Attempt
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.trackingButton, { backgroundColor: colours.danger }]}
            onPress={cancelAttempt}
          >
            <Text
              style={[
                styles.trackingButtonText,
                { color: "#ffffff", fontSize: 20 * colours.textScale },
              ]}
            >
              Cancel Attempt
            </Text>
          </TouchableOpacity>
        )}

        {earthquakeAttempts.length > 0 && (
          <View style={cardStyle}>
            <Text
              style={[
                styles.cardHeader,
                { color: colours.subText, fontSize: 18 * colours.textScale },
              ]}
            >
              Attempts
            </Text>
            {earthquakeAttempts.map((attempt, idx) => (
              <View key={attempt.id} style={styles.attemptRow}>
                <Text
                  style={[
                    styles.attemptIndex,
                    { color: colours.primary, fontSize: 14 * colours.textScale },
                  ]}
                >
                  #{idx + 1}
                </Text>
                <Text
                  style={[
                    styles.attemptDetail,
                    { color: colours.text, fontSize: 14 * colours.textScale },
                  ]}
                >
                  {attempt.timestamp.toLocaleTimeString()}
                </Text>
                <Text
                  style={[
                    styles.attemptTime,
                    { color: colours.success, fontSize: 14 * colours.textScale },
                  ]}
                >
                  {attempt.peakPGA.toFixed(2)}g ({attempt.avgPGA.toFixed(2)}g avg)
                </Text>
              </View>
            ))}
          </View>
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
            ]}
            onPress={onSubmit}
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
  trackingButton: {
    backgroundColor: "#1d5db1",
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
    marginTop: 40,
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
    color: "#15a94b",
    width: "40%",
    textAlign: "right",
  },
});