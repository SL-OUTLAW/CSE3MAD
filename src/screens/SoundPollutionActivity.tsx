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
  if (db <= 0) return "LISTENING";
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
    <View style={[styles.outerContainer, { backgroundColor: colours.background }]}>
      <ScrollView
        style={[styles.phoneFrame, { backgroundColor: colours.background }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { color: colours.text, fontSize: 22 * colours.textScale }]}>Sound Pollution Hunter</Text>

        <View style={[cardStyle, { minHeight: 200 }]}>
          <Text style={[styles.cardHeader, { color: colours.text, fontSize: 18 * colours.textScale }]}>Live Sensor Data</Text>

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
          <Text style={[styles.cardHeader, { color: colours.text, fontSize: 18 * colours.textScale }]}>Sound Chart (dB)</Text>
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
                r: "2",
                strokeWidth: "1",
                stroke: colours.primary,
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>

        <TouchableOpacity style={[styles.trackingButton, { backgroundColor: colours.primary }]} onPress={toggleReading}>
          <Text style={[styles.trackingButtonText, { fontSize: 20 * colours.textScale }]}>
            {isReading
              ? "Pause reading"
              : hasStarted
              ? "Resume reading"
              : "Start reading"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logButton, { borderColor: colours.border, backgroundColor: colours.card, borderWidth: highContrast ? 3 : 2 }]} onPress={handleLogResults}>
          <View style={styles.logButtonContent}>
            <Text style={[styles.logButtonText, { color: colours.text, fontSize: 20 * colours.textScale }]}>Log Results</Text>
            <Text style={[styles.arrowIcon, { color: colours.subText }]}>➔</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <TouchableOpacity style={[styles.quitButton, { borderColor: colours.border, borderWidth: highContrast ? 3 : 2 }]} onPress={onBack}>
            <Text style={[styles.bottomButtonText, { color: colours.text, fontSize: 24 * colours.textScale }]}>Quit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitButton, { borderColor: colours.border, borderWidth: highContrast ? 3 : 2 }]} onPress={onSubmit}>
            <Text style={[styles.bottomButtonText, { color: colours.text, fontSize: 24 * colours.textScale }]}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  phoneFrame: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
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
    paddingBottom: 20,
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
  descriptionText: {
    fontSize: 14,
    color: "#334155",
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 20,
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