import { Gyroscope } from "expo-sensors";
import React, { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type ParachuteTiltScreenProps = {
  onBack: () => void;
};

export default function ParachuteTiltScreen({ onBack }: ParachuteTiltScreenProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [xRotation, setXRotation] = useState(0);
  const [yRotation, setYRotation] = useState(0);
  const [zRotation, setZRotation] = useState(0);
  const [tiltStatus, setTiltStatus] = useState("Not tracking");

  useEffect(() => {
    let subscription: any;

    const checkSensor = async () => {
      const available = await Gyroscope.isAvailableAsync();
      setIsAvailable(available);

      if (!available) {
        Alert.alert(
          "Gyroscope unavailable",
          "This device does not support gyroscope readings."
        );
      }
    };

    checkSensor();

    if (isTracking) {
      Gyroscope.setUpdateInterval(500);

      subscription = Gyroscope.addListener(({ x, y, z }) => {
        const xValue = Number(x.toFixed(3));
        const yValue = Number(y.toFixed(3));
        const zValue = Number(z.toFixed(3));

        setXRotation(xValue);
        setYRotation(yValue);
        setZRotation(zValue);

        const totalTilt = Math.abs(xValue) + Math.abs(yValue) + Math.abs(zValue);

        if (totalTilt < 0.3) {
          setTiltStatus("Stable drop");
        } else if (totalTilt < 1.0) {
          setTiltStatus("Moderate tilt");
        } else {
          setTiltStatus("High tilt detected");
        }
      });
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isTracking]);

  const startTracking = () => {
    setXRotation(0);
    setYRotation(0);
    setZRotation(0);
    setTiltStatus("Tracking started");
    setIsTracking(true);
  };

  const stopTracking = () => {
    setIsTracking(false);
    setTiltStatus("Tracking stopped");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parachute Tilt Detection</Text>

      <Text style={styles.description}>
        Use the gyroscope to monitor parachute tilt during a drop test. A stable
        drop should have lower rotation values.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Sensor available</Text>
        <Text style={styles.value}>{isAvailable ? "Yes" : "No"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>X rotation</Text>
        <Text style={styles.value}>{xRotation}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Y rotation</Text>
        <Text style={styles.value}>{yRotation}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Z rotation</Text>
        <Text style={styles.value}>{zRotation}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tilt status</Text>
        <Text style={styles.statusValue}>{tiltStatus}</Text>
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
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  statusValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2563eb",
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