import { Accelerometer } from "expo-sensors";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { calculateSeismicVibration } from "../services/physicsCalculationService";
import { LineChart } from "react-native-chart-kit";

type EarthquakeDetectionScreenProps = {
  onBack: () => void;
  onLogResults: () => void;
  onSubmit: () => void;
  hasDraft?: boolean;
  activityId?: string;
  activityTitle?: string;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function EarthquakeDetectionScreen({
  onBack,
  onSubmit,
  onLogResults,
  hasDraft,
}: EarthquakeDetectionScreenProps) {
  const [isTracking, setIsTracking] = useState(true);
  const [pga, setPga] = useState(0.0);
  const [mmiLevel, setMmiLevel] = useState("I");
  const [status, setStatus] = useState("SENSOR ACTIVE");

  const [pgaHistory, setPgaHistory] = useState<number[]>([0, 0, 0, 0, 0]);
  const maxPgaRecord = Math.max(...pgaHistory);

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
        if (isTracking) {
          calculateSeismicVibration({ x, y, z }).then((result) => {
            const currentPga = result.accelMagnitude;
            setPga(currentPga);
            setStatus(result.seismicStatus);

            setPgaHistory((prevHistory) => {
              const updated = [...prevHistory, currentPga];
              if (updated.length > 10) {
                updated.shift();
              }
              return updated;
            });

            let currentMmi = "I";
            if (currentPga > 0.8) {
              currentMmi = "VIII";
            } else if (currentPga > 0.34) {
              currentMmi = "VI";
            } else if (currentPga > 0.12) {
              currentMmi = "IV";
            } else if (currentPga > 0.02) {
              currentMmi = "II";
            }

            setMmiLevel(currentMmi);
          });
        }
      });
    };

    startSensor();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isTracking]);

  const toggleTracking = () => {
    if (isTracking) {
      setStatus("PAUSED");
    } else {
      setStatus("SENSOR ACTIVE");
    }
    setIsTracking(!isTracking);
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.phoneFrame}>
        <Text style={styles.headerTitle}>Earthquake-Resistant Structure</Text>

        <View style={styles.sensorCard}>
          <Text style={styles.cardHeader}>Live sensor data</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricColumn}>
              <Text style={styles.metricValue}>{pga.toFixed(2)}g</Text>
              <Text style={styles.metricLabel}>PGA</Text>
            </View>

            <View style={styles.metricColumn}>
              <Text style={styles.metricValue}>{mmiLevel}</Text>
              <Text style={styles.metricLabel}>MMI</Text>
            </View>

            <View style={styles.metricColumn}>
              <Text
                style={[
                  styles.statusText,
                  status !== "SENSOR ACTIVE" &&
                    status !== "PAUSED" && { color: "#dc2626" },
                ]}
              >
                {status}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.sensorCard, { paddingBottom: 0 }]}>
          <Text style={styles.cardHeader}>PGA Chart (g)</Text>
          <Text
            style={[
              styles.cardHeader,
              { fontSize: 14, color: "red", fontWeight: 700 },
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
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(29, 93, 177, ${opacity})`,
              labelColor: () => "black",
              style: { borderRadius: 16 },
              propsForDots: {
                r: "1",
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

        <TouchableOpacity
          style={styles.trackingButton}
          onPress={toggleTracking}
        >
          <Text style={styles.trackingButtonText}>
            {isTracking ? "Pause tracking" : "Resume tracking"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logButton} onPress={onLogResults}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: 600,
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
