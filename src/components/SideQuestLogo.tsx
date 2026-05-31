import React from "react";
import { Image, StyleSheet, View } from "react-native";

type SideQuestLogoProps = {
  size?: number;
};

export default function SideQuestLogo({ size = 175 }: SideQuestLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require("../../assets/images/sidequest-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
});