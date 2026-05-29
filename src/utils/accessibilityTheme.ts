export type TextSizeOption = "normal" | "large" | "extraLarge";

export type AccessibilityOptions = {
  darkMode: boolean;
  colourBlindMode: boolean;
  highContrast: boolean;
  textSize: TextSizeOption;
};

export function getTextScale(textSize: TextSizeOption) {
  if (textSize === "large") return 1.12;
  if (textSize === "extraLarge") return 1.25;
  return 1;
}

export function getAccessibilityTheme({
  darkMode,
  colourBlindMode,
  highContrast,
  textSize,
}: AccessibilityOptions) {
  const primary = colourBlindMode ? "#f97316" : "#2563eb";

  return {
    background: highContrast
      ? darkMode
        ? "#000000"
        : "#ffffff"
      : darkMode
        ? "#0f172a"
        : "#f8fafc",

    card: highContrast
      ? darkMode
        ? "#000000"
        : "#ffffff"
      : darkMode
        ? "#1e293b"
        : "#ffffff",

    text: highContrast
      ? darkMode
        ? "#ffffff"
        : "#000000"
      : darkMode
        ? "#f8fafc"
        : "#0f172a",

    subText: highContrast
      ? darkMode
        ? "#ffffff"
        : "#111827"
      : darkMode
        ? "#cbd5e1"
        : "#64748b",

    border: highContrast
      ? darkMode
        ? "#ffffff"
        : "#000000"
      : darkMode
        ? "#475569"
        : "#e2e8f0",

    rowBorder: highContrast
      ? darkMode
        ? "#ffffff"
        : "#000000"
      : darkMode
        ? "#334155"
        : "#f1f5f9",

    primary,
    danger: highContrast ? "#dc2626" : "#ef4444",
    success: colourBlindMode ? "#0072b2" : "#16a34a",
    warning: colourBlindMode ? "#e69f00" : "#f59e0b",

    switchOnTrack: colourBlindMode ? "#f97316" : "#22c55e",
    switchOffTrack: highContrast
      ? darkMode
        ? "#ffffff"
        : "#111827"
      : darkMode
        ? "#64748b"
        : "#94a3b8",

    switchOnThumb: "#ffffff",
    switchOffThumb: highContrast
      ? darkMode
        ? "#000000"
        : "#ffffff"
      : "#ffffff",

    inactiveButton: highContrast
      ? darkMode
        ? "#000000"
        : "#ffffff"
      : darkMode
        ? "#1e293b"
        : "#ffffff",

    textScale: getTextScale(textSize),
  };
}