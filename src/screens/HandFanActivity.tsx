import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAccessibility } from "../../context/AccessibilityContext";

type SubmitParams = Record<string, string>;

type Props = {
  onBack: () => void;
  onLogResults: (params?: SubmitParams) => void;
  onSubmit: () => void;
};

const MATERIALS = [
  { thickness: `0.1\nmm`, stiffness: 0.05 },   
  { thickness: `0.25\nmm`, stiffness: 0.2 },   
  { thickness: `0.5\nmm`, stiffness: 0.5 },    
  { thickness: `3\nmm`, stiffness: 2.5 },      
];

function num(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

export default function HandFanActivity({ onBack, onLogResults, onSubmit }: Props) {
  const { colours, highContrast } = useAccessibility();
  const [distance, setDistance] = useState("15");
  const [material, setMaterial] = useState(MATERIALS[0].thickness);
  const [fanDesign, setFanDesign] = useState("");
  const [prediction, setPrediction] = useState("");
  const [bendAngle, setBendAngle] = useState("");
  const [observation, setObservation] = useState("");
  const [videoUri, setVideoUri] = useState("");
  const cardStyle = [
    styles.card,
    {
      backgroundColor: colours.card,
      borderColor: colours.border,
      borderWidth: highContrast ? 3 : 1,
    },
  ];

  const inputStyle = [
    styles.input,
    {
      color: colours.text,
      borderColor: colours.border,
      backgroundColor: colours.background,
      fontSize: 16 * colours.textScale,
    },
  ];

  const result = useMemo(() => {
    const angleDeg = num(bendAngle);
    const angleRad = angleDeg * (Math.PI / 180);
    const selected = MATERIALS.find((item) => item.thickness === material);
    const stiffness = selected ? selected.stiffness : 0.05;
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

  const handleLogResults = () => {
    onLogResults({
      defaultMeasuredValue: bendAngle || "0",
      distanceCm: distance,
      materialThicknessMm: material,
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
    <View style={[styles.outer, { backgroundColor: colours.background }]}>
      <KeyboardAvoidingView
        style={[styles.frame, { backgroundColor: colours.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colours.text, fontSize: 22 * colours.textScale }]}>Hand Fan Challenge</Text>

          <View style={cardStyle}>
            <Text style={[styles.cardTitle, { color: colours.text, fontSize: 18 * colours.textScale }]}>Test Measurements</Text>

            <Text style={[styles.label, { color: colours.text, fontSize: 14 * colours.textScale }]}>Thickness (mm)</Text>
            <View style={styles.wrapRow}>
              {MATERIALS.map((item) => (
                <TouchableOpacity
                  key={item.thickness}
                  style={[
                    styles.chip,
                    {
                      borderColor: material === item.thickness ? colours.primary : colours.border,
                      backgroundColor: material === item.thickness ? colours.primary : colours.card,
                      borderWidth: highContrast ? 3 : 1,
                    },
                  ]}
                  onPress={() => setMaterial(item.thickness)}
                >
                  <Text style={[
                    styles.chipText,
                    {
                      color: material === item.thickness ? "#ffffff" : colours.text,
                      fontSize: 18 * colours.textScale,
                    }
                  ]}>
                    {item.thickness}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colours.text, fontSize: 14 * colours.textScale }]}>Bend angle / movement (degrees)</Text>
            <TextInput
              style={inputStyle}
              value={bendAngle}
              onChangeText={setBendAngle}
              keyboardType="decimal-pad"
              placeholder="e.g. 30"
              placeholderTextColor={colours.subText}
            />
          </View>

          <View style={[cardStyle, { marginBottom: 40 }]}>
            <Text style={[styles.cardTitle, { color: colours.text, fontSize: 18 * colours.textScale }]}>Calculated Results</Text>

            <View style={styles.row}>
              <View style={styles.metric}>
                <Text style={[styles.metricValue, { color: colours.primary, fontSize: 24 * colours.textScale }]}>{round(result.angleDeg)}°</Text>
                <Text style={[styles.metricLabel, { color: colours.text, fontSize: 14 * colours.textScale }]}>Bend angle</Text>
              </View>

              <View style={styles.metric}>
                <Text style={[styles.metricValue, { color: colours.primary, fontSize: 24 * colours.textScale }]}>{round(result.force, 4)} N</Text>
                <Text style={[styles.metricLabel, { color: colours.text, fontSize: 14 * colours.textScale }]}>Force est.</Text>
              </View>
            </View>

            <Text style={[styles.resultText, { color: colours.text, fontSize: 15 * colours.textScale }]}>Stiffness: {result.stiffness} N/rad</Text>
            <Text style={[styles.resultText, { color: colours.text, fontSize: 15 * colours.textScale }]}>Angle in radians: {round(result.angleRad)}</Text>
          </View>

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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#ffffff" },
  frame: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 28,
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#000000", marginBottom: 40 },
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
  cardTitle: { fontSize: 18, color: "#666666", fontWeight: "600", marginBottom: 20 },
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
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: "#1d5db1", borderColor: "#1d5db1" },
  chipText: { color: "#1f2937", fontWeight: "800", fontSize: 18, textAlign: "center",},
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
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 12,
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