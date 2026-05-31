import { useTeam } from "../../../context/TeamContext";
import { useAccessibility } from "../../../context/AccessibilityContext";
import { useRouter } from "expo-router";
import { logoutUser } from "../../services/firebase";
import { clearUserSession } from "../../services/userSessionService";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MENU_ITEMS = [
  { label: "Team", route: "/team-edit" },
  { label: "Accessibility", route: "/settings" },
  { label: "Help", route: null },
  { label: "Log out", route: null },
];

export default function AccountScreen() {
  const router = useRouter();
  const { teamName, grade, setTeamName, setGrade, setTeamId, setTeamMembers } = useTeam();
  const { colours, highContrast } = useAccessibility();

    const handleLogout = async () => {
    try {
      await logoutUser();
      await clearUserSession();

      setTeamId("");
      setTeamName("");
      setGrade("");
      setTeamMembers([]);

      router.replace("/login");
    } catch {
      await clearUserSession();
      router.replace("/login");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: highContrast ? colours.background : "#f8f5ff" }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.teamCard,
            {
              backgroundColor: colours.card,
              borderColor: colours.border,
              borderWidth: highContrast ? 3 : 1,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colours.primary }]}>
            <Text style={styles.avatarText}>
              {(teamName || "T").charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.teamInfo}>
            <Text
              style={[
                styles.teamName,
                { color: colours.text, fontSize: 16 * colours.textScale },
              ]}
            >
              {teamName || "Team Name"}
            </Text>

            <Text
              style={[
                styles.gradeText,
                { color: colours.subText, fontSize: 12 * colours.textScale },
              ]}
            >
              Grade {grade || "X"}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            { color: colours.subText, fontSize: 12 * colours.textScale },
          ]}
        >
          Team Information
        </Text>

        <View
          style={[
            styles.cardGroup,
            {
              backgroundColor: colours.card,
              borderColor: colours.border,
              borderWidth: highContrast ? 3 : 1,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push("/team-edit" as any)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.rowText,
                { color: colours.text, fontSize: 15 * colours.textScale },
              ]}
            >
              Team Members
            </Text>
            <Text style={[styles.chevron, { color: colours.subText }]}>›</Text>
          </TouchableOpacity>

        </View>

        <Text
          style={[
            styles.sectionLabel,
            { color: colours.subText, fontSize: 12 * colours.textScale },
          ]}
        >
          Settings
        </Text>

        <View
          style={[
            styles.cardGroup,
            {
              backgroundColor: colours.card,
              borderColor: colours.border,
              borderWidth: highContrast ? 3 : 1,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push("/settings" as any)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.rowText,
                { color: colours.text, fontSize: 15 * colours.textScale },
              ]}
            >
              Accessibility
            </Text>
            <Text style={[styles.chevron, { color: colours.subText }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} activeOpacity={0.75}>
            <Text
              style={[
                styles.rowText,
                { color: colours.text, fontSize: 15 * colours.textScale },
              ]}
            >
              Help & Support
            </Text>
            <Text style={[styles.chevron, { color: colours.subText }]}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => {
            void handleLogout();
          }}
          activeOpacity={0.75}
        >
          <Text style={styles.signOutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f5ff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  teamCard: {
  backgroundColor: "#ffffff",
  borderRadius: 26,
  borderWidth: 1,
  borderColor: "#ede9fe",
  paddingHorizontal: 22,
  paddingVertical: 22,
  flexDirection: "row",
  alignItems: "center",
  gap: 18,
  marginBottom: 24,
  shadowColor: "#312e81",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.08,
  shadowRadius: 18,
  elevation: 4,
},
avatar: {
  width: 78,
  height: 78,
  borderRadius: 26,
  backgroundColor: "#7c3aed",
  alignItems: "center",
  justifyContent: "center",
},
avatarText: {
  color: "#ffffff",
  fontSize: 34,
  fontWeight: "900",
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#18181b",
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#71717a",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7c3aed",
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ede9fe",
    overflow: "hidden",
    marginBottom: 18,
  },
  row: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  rowText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#18181b",
  },
  chevron: {
    fontSize: 22,
    fontWeight: "800",
    color: "#a1a1aa",
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  signOutText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "900",
  },
});