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
    <View style={[styles.outer, { backgroundColor: highContrast ? colours.background : "#f8f5ff" }]}>
      <KeyboardAvoidingView
        style={[styles.frame, { backgroundColor: highContrast ? colours.background : "#f8f5ff" }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}><View style={styles.heroIconBox}><Text style={styles.heroEmoji}>🌬️</Text></View><View style={styles.heroTextGroup}><Text style={[styles.heroTitle, { color: colours.text, fontSize: 24 * colours.textScale }]}>Hand Fan{"\n"}Challenge</Text><Text style={[styles.heroSubtitle, { color: colours.subText, fontSize: 14 * colours.textScale }]}>Build • Test • Measure</Text></View></View>
          <View style={cardStyle}>
            <Text style={[styles.cardTitle, { color: colours.text, fontSize: 18 * colours.textScale }]}>🧪 Test Setup</Text>

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
            <Text style={[styles.cardTitle, { color: colours.text, fontSize: 18 * colours.textScale }]}>📊 Fan Power Results</Text>

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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#f8f5ff" },
  frame: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 28,
    backgroundColor: "#f8f5ff",
  },
  title: { fontSize: 24, fontWeight: "900", color: "#18181b", marginBottom: 20, lineHeight: 32 },
  card: {
    borderWidth: 1,
    borderColor: "#ede9fe",
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#ffffff",
    marginBottom: 20,
    shadowColor: "#312e81",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, color: "#18181b", fontWeight: "900", marginBottom: 20 },
  row: { flexDirection: "row", gap: 10 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd6fe",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "center",
  },
  chipText: { color: "#1f2937", fontWeight: "900", fontSize: 18, textAlign: "center" },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 12,
    color: "#18181b",
    backgroundColor: "#fafafa",
  },
  metric: { flex: 1, alignItems: "center", marginBottom: 12 },
  metricValue: { fontSize: 24, fontWeight: "900", color: "#7c3aed" },
  metricLabel: { fontSize: 14, color: "#18181b", fontWeight: "800" },
  resultText: { fontSize: 15, color: "#1f2937", marginBottom: 6, fontWeight: "700" },
  logButton: {
    borderWidth: 1,
    height: 58,
    borderColor: "#7c3aed",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
    backgroundColor: "#7c3aed",
  },
  logButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logButtonText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    flex: 1,
  },
  arrowIcon: {
    fontSize: 20,
    color: "#ffffff",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quitButton: {
    backgroundColor: "#ef4444",
    borderWidth: 0,
    borderRadius: 18,
    height: 58,
    paddingVertical: 10,
    width: "45%",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    backgroundColor: "#22c55e",
    borderWidth: 0,
    height: 58,
    borderRadius: 18,
    paddingVertical: 10,
    width: "45%",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomButtonText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
  },
  heroCard: { backgroundColor: "#ffffff", borderRadius: 26, padding: 18, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 18, borderWidth: 1, borderColor: "#ede9fe", shadowColor: "#312e81", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },
  heroIconBox: { width: 76, height: 76, borderRadius: 22, backgroundColor: "#f5f3ff", alignItems: "center", justifyContent: "center" },
  heroEmoji: { fontSize: 34 },
  heroTextGroup: { flex: 1 },
  heroTitle: { fontSize: 24, fontWeight: "900", color: "#18181b", lineHeight: 32 },
  heroSubtitle: { fontWeight: "800", marginTop: 4 },
});