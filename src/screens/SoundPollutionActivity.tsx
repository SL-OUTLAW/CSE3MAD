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

  // Expo metering is usually negative dBFS. This converts it into a classroom-friendly 0–100 style dB estimate.
  const estimatedDb = Math.max(0, Math.min(100, 100 + metering));
  return round(estimatedDb);
}

function getSoundStatus(db: number) {
  if (db <= 0) return "LISTENING";
  if (db < 60) return "SAFE";
  if (db < 85) return "MODERATE";
  if (db < 100) return "HIGH";
  return "DANGEROUS";
}

function getSoundDescription(db: number) {
  if (db <= 0) return "Listening for sound level.";
  if (db < 60) return "Safe for normal classroom activity.";
  if (db < 85) return "Generally safe, but long exposure can cause fatigue.";
  if (db < 100) return "Hearing damage is possible after long exposure.";
  return "Dangerous noise level. Move away or reduce exposure.";
}

export default function SoundPollutionActivity({
  onBack,
  onLogResults,
  onSubmit,
}: SoundPollutionActivityProps) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isReading, setIsReading] = useState(false);
  const [currentDb, setCurrentDb] = useState(0);
  const [dbHistory, setDbHistory] = useState<number[]>([0, 0, 0, 0, 0]);
  const [sensorStatus, setSensorStatus] = useState("MIC READY");

  const result = useMemo(() => {
    return {
      level: getSoundStatus(currentDb),
      description: getSoundDescription(currentDb),
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
        // Ignore stop error if recording was already stopped.
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
      setSensorStatus("LISTENING");

      intervalRef.current = setInterval(async () => {
        if (!recordingRef.current) {
          return;
        }

        const status = await recordingRef.current.getStatusAsync();

        if (!status.isRecording) {
          return;
        }

        const nextDb = meterToDb(status.metering);
        setCurrentDb(nextDb);
        updateChart(nextDb);
      }, 500);
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
      soundDescription: result.description,
    });
  };

  useEffect(() => {
    void startReading();

    return () => {
      void stopReading();
    };
  }, []);

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.phoneFrame} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Sound Pollution Hunter</Text>

        <View style={styles.sensorCard}>
          <Text style={styles.cardHeader}>Live sound measurements</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricColumn}>
              <Text style={styles.metricValue}>{currentDb} dB</Text>
              <Text style={styles.metricLabel}>Current dB</Text>
            </View>

            <View style={styles.metricColumn}>
              <Text
                style={[
                  styles.statusText,
                  (result.level === "HIGH" || result.level === "DANGEROUS") && {
                    color: "#dc2626",
                  },
                ]}
              >
                {result.level}
              </Text>
              <Text style={styles.metricLabel}>Level</Text>
            </View>

            <View style={styles.metricColumn}>
              <Text style={styles.metricValue}>{result.peakDb} dB</Text>
              <Text style={styles.metricLabel}>Peak</Text>
            </View>
          </View>

          <Text style={styles.resultText}>{result.description}</Text>
          <Text style={styles.sensorText}>{sensorStatus}</Text>
        </View>

        <View style={[styles.sensorCard, { paddingBottom: 0 }]}>
          <Text style={styles.cardHeader}>Sound Chart (dB)</Text>
          <Text style={styles.peakText}>
            {result.peakDb > 0 ? `Peak: ${result.peakDb} dB` : ""}
          </Text>

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
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(29, 93, 177, ${opacity})`,
              labelColor: () => "black",
              style: { borderRadius: 16 },
              propsForDots: {
                r: "2",
                strokeWidth: "1",
                stroke: "#1d5db1",
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>

        <TouchableOpacity style={styles.trackingButton} onPress={toggleReading}>
          <Text style={styles.trackingButtonText}>
            {isReading ? "Pause reading" : "Resume reading"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logButton} onPress={handleLogResults}>
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
    paddingTop: 40,
    paddingBottom: 28,
    backgroundColor: "#ffffff",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 24,
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
    fontSize: 18,
    fontWeight: "800",
    color: "#1d5db1",
    textAlign: "center",
    marginBottom: 2,
  },
  resultText: {
    fontSize: 15,
    color: "#1f2937",
    marginBottom: 6,
  },
  sensorText: {
    fontSize: 15,
    color: "#dc2626",
    fontWeight: "800",
    marginTop: 8,
  },
  peakText: {
    fontSize: 14,
    color: "red",
    fontWeight: "700",
    marginBottom: 8,
  },
  trackingButton: {
    backgroundColor: "#1d5db1",
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  trackingButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  logButton: {
    backgroundColor: "#1d5db1",
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  logButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  arrowIcon: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  bottomRow: {
    flexDirection: "row",
    gap: 12,
  },
  quitButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  bottomButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});