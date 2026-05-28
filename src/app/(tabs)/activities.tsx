import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAccessibility } from "../../../context/AccessibilityContext";
import { activities } from "../../data/activities";

export default function ActivitiesScreen() {
  const router = useRouter();
  const { colours, highContrast } = useAccessibility();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colours.card,
      borderColor: colours.border,
      borderWidth: highContrast ? 3 : 1,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colours.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
        <Text
          style={[
            styles.title,
            { color: colours.text, fontSize: 28 * colours.textScale },
          ]}
        >
          Activity Library
        </Text>

        <Text
          style={[
            styles.bodyText,
            { color: colours.subText, fontSize: 16 * colours.textScale },
          ]}
        >
          Choose one of the 7 STEMM activities.
        </Text>

        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={cardStyle}
              onPress={() => router.push(`../activity/${item.id}`)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.cardTitle,
                  { color: colours.text, fontSize: 18 * colours.textScale },
                ]}
              >
                {item.title}
              </Text>

              <Text
                style={[
                  styles.category,
                  { color: colours.primary, fontSize: 14 * colours.textScale },
                ]}
              >
                {item.category}
              </Text>

              <Text
                style={[
                  styles.cardText,
                  { color: colours.subText, fontSize: 15 * colours.textScale },
                ]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
  },
  title: {
    fontWeight: "800",
    marginBottom: 8,
  },
  bodyText: {
    lineHeight: 22,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    marginVertical: 8,
  },
  cardTitle: {
    fontWeight: "800",
    marginBottom: 6,
  },
  category: {
    fontWeight: "700",
    marginBottom: 8,
  },
  cardText: {
    lineHeight: 21,
  },
});