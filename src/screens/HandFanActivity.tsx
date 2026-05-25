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
  onSubmit: (params?: SubmitParams) => void;
};

const DISTANCES = ["15", "30", "45"];
const MATERIALS = [
  { name: "Paper", stiffness: 0.05 },
  { name: "Card stock", stiffness: 0.2 },
  { name: "Cardboard", stiffness: 0.5 },
];

function num(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

export default function HandFanActivity({ onBack, onSubmit }: Props) {
  const [distance, setDistance] = useState("15");
  const [material, setMaterial] = useState("Paper");
  const [fanDesign, setFanDesign] = useState("");
  const [prediction, setPrediction] = useState("");
  const [bendAngle, setBendAngle] = useState("");
  const [observation, setObservation] = useState("");
  const [videoUri, setVideoUri] = useState("");

  const result = useMemo(() => {
    const angleDeg = num(bendAngle);
    const angleRad = angleDeg * (Math.PI / 180);
    const stiffness =
      MATERIALS.find((item) => item.name === material)?.stiffness ?? 0.05;
    const force = stiffness * angleRad;

    const movement =
      angleDeg <= 0
        ? "Enter bend angle"
        : angleDeg < 15
          ? "Small movement"
          : angleDeg < 35
            ? "Moderate movement"
            : "Strong movement";

    return { angleDeg, angleRad, stiffness, force, movement };
  }, [bendAngle, material]);

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

  const chooseVideo = async () => {
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

  const handleSubmit = () => {
    onSubmit({
      defaultMeasuredValue: bendAngle || "0",
      distanceCm: distance,
      material,
      fanDesign,
      prediction,
      bendAngleDeg: String(round(result.angleDeg)),
      bendAngleRad: String(round(result.angleRad)),
      stiffnessNPerRad: String(result.stiffness),
      estimatedForceN: String(round(result.force, 4)),
      movementLevel: result.movement,
      observation,
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
          <Text style={styles.title}>Hand Fan Challenge</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Video evidence</Text>
            <Text style={styles.helpText}>
              Record paper/cardboard bending while using a hand fan.
            </Text>

            <View style={styles.row}>
              <TouchableOpacity style={styles.outlineButton} onPress={recordVideo}>
                <Text style={styles.outlineButtonText}>Record Video</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.outlineButton} onPress={chooseVideo}>
                <Text style={styles.outlineButtonText}>Choose Video</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.videoStatus}>
              {videoUri ? "Video evidence attached" : "No video attached yet"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Test setup</Text>

            <Text style={styles.label}>Fan distance (cm)</Text>
            <View style={styles.row}>
              {DISTANCES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, distance === item && styles.chipSelected]}
                  onPress={() => setDistance(item)}
                >
                  <Text style={[styles.chipText, distance === item && styles.chipTextSelected]}>
                    {item} cm
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Material</Text>
            <View style={styles.wrapRow}>
              {MATERIALS.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.chip, material === item.name && styles.chipSelected]}
                  onPress={() => setMaterial(item.name)}
                >
                  <Text style={[styles.chipText, material === item.name && styles.chipTextSelected]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Fan design</Text>
            <TextInput
              style={styles.input}
              value={fanDesign}
              onChangeText={setFanDesign}
              placeholder="e.g. thick paper fan"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Prediction</Text>
            <TextInput
              style={styles.input}
              value={prediction}
              onChangeText={setPrediction}
              placeholder="e.g. paper bends most at 15 cm"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Bend angle / movement (degrees)</Text>
            <TextInput
              style={styles.input}
              value={bendAngle}
              onChangeText={setBendAngle}
              keyboardType="decimal-pad"
              placeholder="e.g. 30"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Observation notes</Text>
            <TextInput
              style={styles.input}
              value={observation}
              onChangeText={setObservation}
              placeholder="e.g. paper bent backwards clearly"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calculated results</Text>

            <View style={styles.row}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{round(result.angleDeg)}°</Text>
                <Text style={styles.metricLabel}>Bend angle</Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricValue}>{round(result.force, 4)} N</Text>
                <Text style={styles.metricLabel}>Force est.</Text>
              </View>
            </View>

            <Text style={styles.resultText}>Stiffness: {result.stiffness} N/rad</Text>
            <Text style={styles.resultText}>Angle in radians: {round(result.angleRad)}</Text>
            <Text style={styles.status}>{result.movement}</Text>
          </View>

          <TouchableOpacity style={styles.logButton} onPress={handleSubmit}>
            <Text style={styles.logButtonText}>Log Results ➔</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <TouchableOpacity style={styles.quitButton} onPress={onBack}>
              <Text style={styles.bottomText}>Quit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
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
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    marginBottom: 12,
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