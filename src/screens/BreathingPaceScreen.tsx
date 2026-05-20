import { Accelerometer } from "expo-sensors";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type BreathingPaceScreenProps = {
  onBack: () => void;
};

export default function BreathingPaceScreen({ onBack }: BreathingPaceScreenProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [movement, setMovement] = useState(0);
  const [breathCount, setBreathCount] = useState(0);
  const [lastPeakTime, setLastPeakTime] = useState(0);

  useEffect(() => {
    let subscription: any;

    const checkSensor = async () => {
      const available = await Accelerometer.isAvailableAsync();
      setIsAvailable(available);

      if (!available) {
        Alert.alert(
          "Accelerometer unavailable",
          "This device does not support accelerometer readings."
        );
      }
    };

    checkSensor();

    if (isTracking) {
      Accelerometer.setUpdateInterval(500);

      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const totalMovement = Math.sqrt(x * x + y * y + z * z);
        setMovement(Number(totalMovement.toFixed(3)));

        const now = Date.now();

        if (totalMovement > 1.08 && now - lastPeakTime > 2500) {
          setBreathCount((current) => current + 1);
          setLastPeakTime(now);
        }
      });
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isTracking, lastPeakTime]);

  const startTracking = () => {
    setBreathCount(0);
    setMovement(0);
    setLastPeakTime(0);
    setIsTracking(true);
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Breathing Pace Trainer</Text>

      <Text style={styles.description}>
        Place the phone gently on the chest and record breathing movement using
        the accelerometer.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Sensor available</Text>
        <Text style={styles.value}>{isAvailable ? "Yes" : "No"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Current movement</Text>
        <Text style={styles.value}>{movement}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Estimated breaths detected</Text>
        <Text style={styles.value}>{breathCount}</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={isTracking ? stopTracking : startTracking}
      >
        <Text style={styles.buttonText}>
          {isTracking ? "Stop Tracking" : "Start Tracking"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    color: "#0f172a",
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    color: "#334155",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  label: {
    fontSize: 15,
    color: "#475569",
    marginBottom: 4,
  },
  value: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "800",
  },
});