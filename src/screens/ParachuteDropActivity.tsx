import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type SubmitParams = Record<string, string>;

type Props = {
  onBack: () => void;
  onLogResults: (params?: SubmitParams) => void;
  onSubmit: () => void;
};

const ATTEMPTS = ["Baseline", "Prototype 1", "Prototype 2", "Prototype 3"];

function num(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

export default function ParachuteDropActivity({ onBack, onLogResults, onSubmit }: Props) {
  const [attempt, setAttempt] = useState("Baseline");
  const [height, setHeight] = useState("1.75");
  const [mass, setMass] = useState("0.2");
  const [designNotes, setDesignNotes] = useState("");
  const [fallTime, setFallTime] = useState("");
  const [stopTime, setStopTime] = useState("");
  const [videoUri, setVideoUri] = useState("");

  const result = useMemo(() => {
    const h = num(height);
    const m = num(mass);
    const fall = num(fallTime);
    const stop = num(stopTime);

    const velocity = h > 0 && fall > 0 ? (2 * h) / fall : 0;
    const acceleration = fall > 0 ? velocity / fall : 0;
    const weightForce = m * 9.81;
    const netForce = m * acceleration;
    const dragForce = Math.max(weightForce - netForce, 0);
    const gForce = stop > 0 ? velocity / stop / 9.81 : 0;

    const status =
      fall <= 0
        ? "Enter slow-mo timing"
        : velocity < 1
          ? "Slow safe landing"
          : velocity < 2
            ? "Moderate landing"
            : "Fast landing";

    return { velocity, acceleration, weightForce, netForce, dragForce, gForce, status };
  }, [height, mass, fallTime, stopTime]);

  const recordVideo = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }

    const video = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!video.canceled) {
      setVideoUri(video.assets[0].uri);
    }
  };

  const chooseSlowMoVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow video access.");
      return;
    }

    const video = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
    });

    if (!video.canceled) {
      setVideoUri(video.assets[0].uri);
    }
  };

  const handleLogResults = () => {
  onLogResults({
      defaultMeasuredValue: fallTime || "0",
      attempt,
      dropHeightM: height,
      toyMassKg: mass,
      designNotes,
      fallTimeSeconds: fallTime || "0",
      stopTimeSeconds: stopTime || "0",
      finalVelocityMs: String(round(result.velocity)),
      accelerationMs2: String(round(result.acceleration)),
      weightForceN: String(round(result.weightForce)),
      netForceN: String(round(result.netForce)),
      dragForceN: String(round(result.dragForce)),
      gForce: String(round(result.gForce)),
      videoAttached: String(Boolean(videoUri)),
    });
  };

  return (
    <View style={styles.outer}>
      <KeyboardAvoidingView
        style={styles.frame}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Parachute Drop Challenge</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Attempt</Text>
            <View style={styles.wrapRow}>
              {ATTEMPTS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, attempt === item && styles.chipSelected]}
                  onPress={() => setAttempt(item)}
                >
                  <Text style={[styles.chipText, attempt === item && styles.chipTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Slow-motion evidence</Text>
            <Text style={styles.helpText}>
              Record the drop, or choose an iPhone Slo-mo video. Use it to estimate first hit and stop time.
            </Text>

            <View style={styles.row}>
              <TouchableOpacity style={styles.outlineButton} onPress={recordVideo}>
                <Text style={styles.outlineButtonText}>Record Video</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.outlineButton} onPress={chooseSlowMoVideo}>
                <Text style={styles.outlineButtonText}>Choose Slo-mo</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.videoStatus}>
              {videoUri ? "Video evidence attached" : "No video attached yet"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Measurements</Text>

            <Text style={styles.label}>Drop height (m)</Text>
              <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              placeholder="Drop height (m)"
              placeholderTextColor="#64748b"
            />
            <Text style={styles.label}>Toy mass (kg)</Text>
            <TextInput
              style={styles.input}
              value={mass}
              onChangeText={setMass}
              keyboardType="decimal-pad"
              placeholder="Toy mass (kg)"
              placeholderTextColor="#64748b"
            />
            <Text style={styles.label}>Prediction / parachute design notes</Text>
            <TextInput
              style={styles.input}
              value={designNotes}
              onChangeText={setDesignNotes}
              placeholder="e.g. larger parachute will fall slowest"
              placeholderTextColor="#64748b"
            />
            <Text style={styles.label}>Time to first hit ground (s)</Text>
            <TextInput
              style={styles.input}
              value={fallTime}
              onChangeText={setFallTime}
              keyboardType="decimal-pad"
              placeholder="e.g. 1.2"
              placeholderTextColor="#64748b"
            />
            <Text style={styles.label}>Time from first hit to stop (s)</Text>
            <TextInput
              style={styles.input}
              value={stopTime}
              onChangeText={setStopTime}
              keyboardType="decimal-pad"
              placeholder="e.g. 0.05"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calculated results</Text>

            <View style={styles.row}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{round(result.velocity)} m/s</Text>
                <Text style={styles.metricLabel}>Velocity</Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricValue}>{round(result.gForce)}g</Text>
                <Text style={styles.metricLabel}>G-force</Text>
              </View>
            </View>

            <Text style={styles.resultText}>Acceleration: {round(result.acceleration)} m/s²</Text>
            <Text style={styles.resultText}>Weight force: {round(result.weightForce)} N</Text>
            <Text style={styles.resultText}>Net force: {round(result.netForce)} N</Text>
            <Text style={styles.resultText}>Drag force estimate: {round(result.dragForce)} N</Text>
            <Text style={styles.status}>{result.status}</Text>
          </View>

          <TouchableOpacity style={styles.logButton} onPress={handleLogResults}>
            <Text style={styles.logButtonText}>Log Results ➔</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <TouchableOpacity style={styles.quitButton} onPress={onBack}>
              <Text style={styles.bottomText}>Quit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
              <Text style={styles.bottomText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#ffffff" },
  frame: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 28,
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#000000", marginBottom: 30 },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#ffffff",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, color: "#666666", fontWeight: "600", marginBottom: 14 },
  helpText: { fontSize: 14, color: "#64748b", lineHeight: 20, marginBottom: 12 },
  row: { flexDirection: "row", gap: 10 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipSelected: { backgroundColor: "#1d5db1", borderColor: "#1d5db1" },
  chipText: { color: "#1f2937", fontWeight: "800" },
  chipTextSelected: { color: "#ffffff" },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1d5db1",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  outlineButtonText: { color: "#1d5db1", fontSize: 15, fontWeight: "800" },
  videoStatus: { fontSize: 14, color: "#64748b", fontWeight: "700", marginTop: 10 },
label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    color: "#0f172a",
  },
  metric: { flex: 1, alignItems: "center", marginBottom: 12 },
  metricValue: { fontSize: 24, fontWeight: "800", color: "#1d5db1" },
  metricLabel: { fontSize: 14, color: "#000000", fontWeight: "800" },
  resultText: { fontSize: 15, color: "#1f2937", marginBottom: 6, fontWeight: "600" },
  status: { fontSize: 15, color: "#1d5db1", fontWeight: "800", marginTop: 4 },
  logButton: {
    backgroundColor: "#1d5db1",
    borderRadius: 14,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  quitButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
});