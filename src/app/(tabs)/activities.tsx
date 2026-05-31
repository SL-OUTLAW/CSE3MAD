import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAccessibility } from "../../../context/AccessibilityContext";
import { activities } from "../../data/activities";

function getActivityIcon(id: string) {
  if (id === "A1") return "🪂";
  if (id === "A2") return "🔊";
  if (id === "A3") return "🌬️";
  if (id === "A4") return "🏢";
  if (id === "A5") return "🏃";
  if (id === "A6") return "⚡";
  return "🫁";
}

export default function ActivitiesScreen() {
  const router = useRouter();
  const { colours, highContrast } = useAccessibility();
  const [searchText, setSearchText] = useState("");

  const filteredActivities = useMemo(() => {
  return activities.filter((item) => item.title.toLowerCase().includes(searchText.toLowerCase()) || item.description.toLowerCase().includes(searchText.toLowerCase()));
}, [searchText]);

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
      style={[styles.safeArea, { backgroundColor: highContrast ? colours.background : "#f8f5ff" }]}
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
          Choose a challenge and start exploring!
        </Text>

        <View style={styles.searchRow}>
          <TextInput style={[styles.searchInput, { color: colours.text, fontSize: 14 * colours.textScale }]} placeholder="Search activities..." placeholderTextColor={colours.subText} value={searchText} onChangeText={setSearchText} />
        </View>

        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={cardStyle} onPress={() => router.push(`../activity/${item.id}`)} activeOpacity={0.8}>
              <View style={styles.cardRow}>
                <View style={styles.iconBox}>
                  <Text style={styles.activityIcon}>{getActivityIcon(item.id)}</Text>
                </View>

              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: colours.text, fontSize: 16 * colours.textScale }]}>{item.id.replace("A", "")}. {item.title}</Text>
                <Text style={[styles.category, { color: colours.primary, fontSize: 13 * colours.textScale }]}>{item.category}</Text>
                <Text style={[styles.cardText, { color: colours.subText, fontSize: 14 * colours.textScale }]} numberOfLines={2}>{item.description}</Text>
              </View>

              <Text style={[styles.arrow, { color: colours.subText }]}>›</Text>
            </View>
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
    backgroundColor: "#f8f5ff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 0,
  },
  title: {
    fontWeight: "900",
    marginBottom: 6,
  },
  bodyText: {
    lineHeight: 22,
    marginBottom: 18,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 90,
  },
  card: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    marginVertical: 7,
    shadowColor: "#312e81",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: "900",
    marginBottom: 6,
  },
  category: {
    fontWeight: "900",
    marginBottom: 8,
  },
  cardText: {
    lineHeight: 21,
  },
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  searchInput: { flex: 1, height: 46, backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#ede9fe", paddingHorizontal: 16, fontWeight: "700" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 58, height: 58, borderRadius: 18, backgroundColor: "#f5f3ff", alignItems: "center", justifyContent: "center" },
  activityIcon: { fontSize: 30 },
  cardInfo: { flex: 1 },
  arrow: { fontSize: 28, fontWeight: "800" },
});