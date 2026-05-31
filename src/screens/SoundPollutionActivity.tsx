import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { LineChart } from "react-native-chart-kit";
import { useAccessibility } from "../../context/AccessibilityContext";

type SubmitParams = Record<string, string>;

type SoundPollutionActivityProps = {
  onBack: () => void;
  onLogResults: (params?: SubmitParams) => void;
  onSubmit: () => void;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

function round(value: number, decimals = 0) {
  return Number(value.toFixed(decimals));
}


function meterToDb(metering: number | undefined) {
  if (typeof metering !== "number") {
    return 0;
  }
  const estimatedDb = Math.max(0, Math.min(100, 100 + metering));
  return round(estimatedDb);
}


function getSoundStatus(db: number) {
  if (db <= 0) return "SENSOR ACTIVE";
  if (db < 30) return "SAFE";
  if (db < 60) return "QUIET";
  if (db < 85) return "MODERATE";
  if (db < 90) return "HIGH";
  if (db < 100) return "VERY HIGH";
  return "DANGEROUS";
}

export default function SoundPollutionActivity({
  onBack,
  onLogResults,
  onSubmit,
}: SoundPollutionActivityProps) {
  const { colours, highContrast } = useAccessibility();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isReading, setIsReading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); 
  const [currentDb, setCurrentDb] = useState(0);
  const [dbHistory, setDbHistory] = useState<number[]>([0, 0, 0, 0, 0]);
  const [sensorStatus, setSensorStatus] = useState("SENSOR ACTIVE");
  const cardStyle = [
    styles.sensorCard,
    {
      backgroundColor: colours.card,
      borderColor: colours.border,
      borderWidth: highContrast ? 3 : 1,
    },
  ];

  const result = useMemo(() => {
    return {
      level: getSoundStatus(currentDb),
      peakDb: Math.max(...dbHistory, currentDb),
    };
  }, [currentDb, dbHistory]);

  const updateChart = (nextDb: number) => {
    setDbHistory((prevHistory) => {
      const updated = [...prevHistory, nextDb];
      if (updated.length > 10) {
        updated.shift();
      }
      return updated;
    });
  };

  const stopReading = async () => {
    setIsReading(false);
    setSensorStatus("PAUSED");

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        
      }
      recordingRef.current = null;
    }
  };

  const startReading = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone permission needed",
          "Please allow microphone access to measure sound levels."
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.LOW_QUALITY,
        isMeteringEnabled: true,
      });
      await recording.startAsync();

      recordingRef.current = recording;
      setIsReading(true);
      setHasStarted(true); 
      setSensorStatus("LISTENING");

      intervalRef.current = setInterval(async () => {
        if (!recordingRef.current) return;
        const status = await recordingRef.current.getStatusAsync();
        if (!status.isRecording) return;
        const nextDb = meterToDb(status.metering);
        setCurrentDb(nextDb);
        updateChart(nextDb);
      }, 100);
    } catch {
      Alert.alert(
        "Sound sensor error",
        "Could not start microphone sound reading on this device."
      );
      setSensorStatus("MIC ERROR");
    }
  };

  const toggleReading = async () => {
    if (isReading) {
      await stopReading();
    } else {
      await startReading();
    }
  };

  const handleLogResults = () => {
    onLogResults({
      defaultMeasuredValue: String(currentDb),
      currentDb: String(currentDb),
      peakDb: String(result.peakDb),
      riskLevel: result.level,
    });
  };

  
  useEffect(() => {
    return () => {
      void stopReading();
    };
  }, []);

  return (
    <View
  style={[
    styles.outerContainer,
    { backgroundColor: highContrast ? colours.background : "#f8f5ff" },
  ]}
>
  <ScrollView
    style={[
      styles.phoneFrame,
      { backgroundColor: highContrast ? colours.background : "#f8f5ff" },
    ]}
    showsVerticalScrollIndicator={false}
  >
          <View style={styles.heroCard}><View style={styles.heroIconBox}><Text style={styles.heroEmoji}>🔊</Text></View><View style={styles.heroTextGroup}><Text style={[styles.headerTitle, { color: colours.text, fontSize: 24 * colours.textScale }]}>Sound Pollution{"\n"}Hunter</Text><Text style={[styles.heroSubtitle, { color: colours.subText, fontSize: 14 * colours.textScale }]}>Environmental Science</Text></View></View>
          <View style={[cardStyle, { minHeight: 200 }]}>
          <Text style={[styles.cardHeader, { color: colours.text, fontSize: 18 * colours.textScale }]}>🎧 Live Sensor Data</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricColumn}>
              <Text style={[styles.metricValue, { color: colours.primary, fontSize: 22 * colours.textScale }]}>{currentDb} dB</Text>
              <Text style={[styles.metricValue, { color: colours.primary, fontSize: 13 * colours.textScale }]}>Current dB</Text>
            </View>

            <View style={styles.metricColumn}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.statusText,
                  {
                    color:
                  (result.level.includes("HIGH") || result.level === "DANGEROUS"
                      ? colours.danger
                      : colours.primary),
                      fontSize: 16 * colours.textScale,
                  },
                ]}
              >
                {result.level}
              </Text>
              <Text style={[styles.metricLabel, { color: colours.subText, fontSize: 13 * colours.textScale }]}>Level</Text>
            </View>

            <View style={styles.metricColumn}>
              <Text style={[styles.metricValue, { color: colours.primary, fontSize: 22 * colours.textScale }]}>{result.peakDb} dB</Text>
              <Text style={[styles.metricLabel, { color: colours.subText, fontSize: 13 * colours.textScale }]}>Peak</Text>
            </View>
          </View>
          <Text
            style={[
              styles.sensorText,
              { 
                color: sensorStatus === "SENSOR ACTIVE" ? colours.primary : colours.danger,
                fontSize: 15 * colours.textScale,
              },
            ]}
          >
            {sensorStatus}
          </Text>
        </View>

        <View style={[cardStyle, { paddingBottom: 0 }]}>
          <Text style={[styles.cardHeader, { color: colours.text, fontSize: 18 * colours.textScale }]}>📈 Sound Chart (dB)</Text>
          <Text style={[styles.peakText, { color: colours.danger, fontSize: 14 * colours.textScale }]}>Peak: {result.peakDb} dB</Text>

          <LineChart
            data={{
              labels: [],
              datasets: [{ data: dbHistory }],
            }}
            width={SCREEN_WIDTH - 95}
            height={150}
            segments={3}
            yAxisSuffix="dB"
            chartConfig={{
              backgroundColor: colours.card,
              backgroundGradientFrom: colours.card,
              backgroundGradientTo: colours.card,
              decimalPlaces: 0,
              color: () => colours.primary,
              labelColor: () => colours.text,
              style: { borderRadius: 16 },
              propsForDots: {
                r: "0",
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

        <TouchableOpacity style={[styles.trackingButton, { backgroundColor: "#7c3aed" }]} onPress={toggleReading}>
          <Text style={[styles.trackingButtonText, { fontSize: 20 * colours.textScale }]}>
            {isReading
              ? "Pause"
              : hasStarted
              ? "Resume"
              : "Start"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logButton, { borderColor: "#7c3aed", backgroundColor: "#7c3aed", borderWidth: highContrast ? 3 : 1 }]} onPress={handleLogResults}>
          <View style={styles.logButtonContent}>
            <Text style={[styles.logButtonText, { color: "#ffffff", fontSize: 20 * colours.textScale }]}>Log Results</Text>
            <Text style={[styles.arrowIcon, { color: "#ffffff" }]}>➔</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.bottomRow}>
          <TouchableOpacity style={[styles.quitButton, { backgroundColor: colours.danger, borderColor: colours.border, borderWidth: highContrast ? 3 : 2 }]} onPress={onBack}>
            <Text style={[styles.bottomButtonText, { color: "#ffffff", fontSize: 24 * colours.textScale }]}>Quit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colours.success, borderColor: colours.border, borderWidth: highContrast ? 3 : 2 }]} onPress={onSubmit}>
            <Text style={[styles.bottomButtonText, { color: "#ffffff", fontSize: 24 * colours.textScale }]}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#f8f5ff",
  },
  phoneFrame: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 28,
    backgroundColor: "#f8f5ff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#18181b",
    marginBottom: 4,
    lineHeight: 32,
  },
  sensorCard: {
    borderWidth: 1,
    borderColor: "#ede9fe",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
    marginBottom: 20,
    shadowColor: "#312e81",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeader: {
    fontSize: 18,
    color: "#18181b",
    fontWeight: "900",
    marginBottom: 18,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  metricColumn: {
    alignItems: "center",
    flex: 1,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1d5db1",
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 13,
    color: "#475569",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1d5db1",
    textAlign: "center",
    marginBottom: 2,
    flexWrap: "wrap",
    width: "100%",
  },
  sensorText: {
    fontSize: 15,
    color: "#dc2626",
    fontWeight: "800",
    marginTop: 16,
  },
  peakText: {
    fontSize: 14,
    color: "red",
    fontWeight: "700",
    marginBottom: 8,
  },
  trackingButton: {
    backgroundColor: "#1d5db1",
    borderRadius: 14,
    height: 56,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  trackingButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
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
  heroCard: { backgroundColor: "#ffffff", borderRadius: 26, padding: 18, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 18, borderWidth: 1, borderColor: "#ede9fe", shadowColor: "#312e81", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },
  heroIconBox: { width: 76, height: 76, borderRadius: 22, backgroundColor: "#f5f3ff", alignItems: "center", justifyContent: "center" },
  heroEmoji: { fontSize: 34 },
  heroTextGroup: { flex: 1 },
  heroSubtitle: { fontWeight: "800", marginTop: 4 },
});