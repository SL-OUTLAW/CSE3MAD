import * as Battery from "expo-battery";
import React, { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type BatteryStatusScreenProps = {
  onBack: () => void;
};

export default function BatteryStatusScreen({ onBack }: BatteryStatusScreenProps) {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batteryState, setBatteryState] = useState<string>("Checking...");
  const [lowBatteryWarning, setLowBatteryWarning] = useState(false);

  const getBatteryStateText = (state: Battery.BatteryState) => {
    if (state === Battery.BatteryState.CHARGING) return "Charging";
    if (state === Battery.BatteryState.FULL) return "Full";
    if (state === Battery.BatteryState.UNPLUGGED) return "Unplugged";
    return "Unknown";
  };

  const checkBattery = async () => {
    const level = await Battery.getBatteryLevelAsync();
    const state = await Battery.getBatteryStateAsync();

    const percent = Math.round(level * 100);
    setBatteryLevel(percent);
    setBatteryState(getBatteryStateText(state));

    if (percent < 20) {
      setLowBatteryWarning(true);
      Alert.alert(
        "Low battery warning",
        "Your device battery is below 20%. Please charge your device before continuing the activity."
      );
    } else {
      setLowBatteryWarning(false);
    }
  };

  useEffect(() => {
    checkBattery();

    const levelSubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      const percent = Math.round(batteryLevel * 100);
      setBatteryLevel(percent);

      if (percent < 20) {
        setLowBatteryWarning(true);
      } else {
        setLowBatteryWarning(false);
      }
    });

    const stateSubscription = Battery.addBatteryStateListener(({ batteryState }) => {
      setBatteryState(getBatteryStateText(batteryState));
    });

    return () => {
      levelSubscription.remove();
      stateSubscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Battery Monitor</Text>

      <Text style={styles.description}>
        This screen monitors the device battery level and displays a warning if
        the battery drops below 20%.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Battery level</Text>
        <Text style={styles.value}>
          {batteryLevel !== null ? `${batteryLevel}%` : "Checking..."}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Battery state</Text>
        <Text style={styles.value}>{batteryState}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Low battery warning</Text>
        <Text style={lowBatteryWarning ? styles.warningValue : styles.safeValue}>
          {lowBatteryWarning ? "Warning: below 20%" : "Battery level is safe"}
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={checkBattery}>
        <Text style={styles.buttonText}>Refresh Battery Status</Text>
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
  safeValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#16a34a",
  },
  warningValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#dc2626",
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