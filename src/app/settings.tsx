import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAccessibility } from "../../context/AccessibilityContext";
import AccessibilitySettings from "../components/AccessibilitySettings";

export default function SettingsScreen() {
  const router = useRouter();
  const { colours, highContrast } = useAccessibility();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: highContrast ? colours.background : "#f8f5ff" }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text
            style={[
              styles.backText,
              {
                color: colours.primary,
                fontSize: 16 * colours.textScale,
              },
            ]}
          >
            ‹ Back to Account
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            {
              color: colours.text,
              fontSize: 28 * colours.textScale,
            },
          ]}
        >
          Accessibility
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: colours.subText,
              fontSize: 14 * colours.textScale,
            },
          ]}
        >
          Customize display, contrast, colour visibility, and text size.
        </Text>

        <AccessibilitySettings />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 28,
  },
  backText: {
    fontWeight: "700",
    marginBottom: 16,
  },
  title: {
    fontWeight: "900",
    marginBottom: 8,
  },
  description: {
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: 8,
  },
});