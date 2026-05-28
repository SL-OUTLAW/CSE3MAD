import React, { createContext, useContext, useMemo, useState } from "react";
import {
  AccessibilityOptions,
  TextSizeOption,
  getAccessibilityTheme,
} from "../src/utils/accessibilityTheme";

type AccessibilityContextData = AccessibilityOptions & {
  colours: ReturnType<typeof getAccessibilityTheme>;
  setDarkMode: (value: boolean) => void;
  setColourBlindMode: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setTextSize: (value: TextSizeOption) => void;
};

const AccessibilityContext = createContext<AccessibilityContextData | undefined>(
  undefined
);

export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [darkMode, setDarkMode] = useState(false);
  const [colourBlindMode, setColourBlindMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [textSize, setTextSize] = useState<TextSizeOption>("normal");

  const colours = useMemo(
    () =>
      getAccessibilityTheme({
        darkMode,
        colourBlindMode,
        highContrast,
        textSize,
      }),
    [darkMode, colourBlindMode, highContrast, textSize]
  );

  return (
    <AccessibilityContext.Provider
      value={{
        darkMode,
        colourBlindMode,
        highContrast,
        textSize,
        colours,
        setDarkMode,
        setColourBlindMode,
        setHighContrast,
        setTextSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);

  if (!context) {
    throw new Error("useAccessibility must be used inside AccessibilityProvider");
  }

  return context;
}