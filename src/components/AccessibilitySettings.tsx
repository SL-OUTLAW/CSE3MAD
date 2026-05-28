import React from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useAccessibility } from "../../context/AccessibilityContext";
import { TextSizeOption } from "../utils/accessibilityTheme";

const TEXT_SIZE_OPTIONS: { label: string; value: TextSizeOption }[] = [
  { label: "Normal", value: "normal" },
  { label: "Large", value: "large" },
  { label: "Extra large", value: "extraLarge" },
];

export default function AccessibilitySettings() {
  const {
    darkMode,
    colourBlindMode,
    highContrast,
    textSize,
    colours,
    setDarkMode,
    setColourBlindMode,
    setHighContrast,
    setTextSize,
  } = useAccessibility();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colours.card,
          borderColor: colours.border,
          borderWidth: highContrast ? 3 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: colours.text, fontSize: 20 * colours.textScale },
        ]}
      >
        Accessibility
      </Text>

      <View style={styles.row}>
        <View style={styles.textBox}>
          <Text
            style={[
              styles.label,
              { color: colours.text, fontSize: 16 * colours.textScale },
            ]}
          >
            Dark mode
          </Text>
          <Text
            style={[
              styles.hint,
              { color: colours.subText, fontSize: 13 * colours.textScale },
            ]}
          >
            Changes the app to a darker colour theme.
          </Text>
        </View>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{
            false: colours.switchOffTrack,
            true: colours.switchOnTrack,
          }}
          thumbColor={darkMode ? colours.switchOnThumb : colours.switchOffThumb}
          ios_backgroundColor={colours.switchOffTrack}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.textBox}>
          <Text
            style={[
              styles.label,
              { color: colours.text, fontSize: 16 * colours.textScale },
            ]}
          >
            Colour blind mode
          </Text>
          <Text
            style={[
              styles.hint,
              { color: colours.subText, fontSize: 13 * colours.textScale },
            ]}
          >
            Changes key accent colours to improve visibility.
          </Text>
        </View>
        <Switch 
        value={colourBlindMode} 
        onValueChange={setColourBlindMode}
        trackColor={{
            false: colours.switchOffTrack, 
            true: colours.switchOnTrack,
          }}
          thumbColor={
            colourBlindMode ? colours.switchOnThumb : colours.switchOffThumb
        }
        ios_backgroundColor={colours.switchOffTrack}
      />
      </View>

      <View style={styles.row}>
        <View style={styles.textBox}>
          <Text
            style={[
              styles.label,
              { color: colours.text, fontSize: 16 * colours.textScale },
            ]}
          >
            High contrast
          </Text>
          <Text
            style={[
              styles.hint,
              { color: colours.subText, fontSize: 13 * colours.textScale },
            ]}
          >
            Makes borders and text contrast stronger.
          </Text>
        </View>
        <Switch 
          value={highContrast} 
          onValueChange={setHighContrast} 
          trackColor={{
            false: colours.switchOffTrack, 
            true: colours.switchOnTrack,
          }}
          thumbColor={
            highContrast ? colours.switchOnThumb : colours.switchOffThumb
          }
          ios_backgroundColor={colours.switchOffTrack}
        />
      </View>

      <View style={styles.textSizeSection}>
        <Text
          style={[
            styles.label,
            { color: colours.text, fontSize: 16 * colours.textScale },
          ]}
        >
          Text size
        </Text>

        <Text
          style={[
            styles.hint,
            { color: colours.subText, fontSize: 13 * colours.textScale },
          ]}
        >
          Increases text size for users with poor eyesight.
        </Text>

        <View style={styles.optionRow}>
          {TEXT_SIZE_OPTIONS.map((option) => {
            const selected = textSize === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: selected ? colours.primary : colours.inactiveButton,
                    borderColor: selected ? colours.primary : colours.border,
                    borderWidth: highContrast ? 3 : 1,
                  },
                ]}
                onPress={() => setTextSize(option.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: selected ? "#ffffff" : colours.text,
                      fontSize: 14 * colours.textScale,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  title: {
    fontWeight: "800",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
  },
  textBox: {
    flex: 1,
  },
  label: {
    fontWeight: "700",
    marginBottom: 4,
  },
  hint: {
    lineHeight: 18,
  },
  textSizeSection: {
    paddingTop: 14,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  optionButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  optionText: {
    fontWeight: "700",
  },
});