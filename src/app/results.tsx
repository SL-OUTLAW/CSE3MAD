import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { useTeam } from "../../context/TeamContext";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { saveDraft, loadDraft } from "../services/resultStorageService";

const StarRating = ({
  rating,
  onRatingChange,
}: {
  rating: number;
  onRatingChange: (rating: number) => void;
}) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.starContainer}>
      {stars.map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRatingChange(star)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.star,
              rating >= star ? styles.starFilled : styles.starEmpty,
            ]}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

type Attachment = {
  uri: string;
  type: "image" | "video";
  thumbnail?: string;
};

const AttachmentPreview = ({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: () => void;
}) => {
  const { uri, type, thumbnail } = attachment;
  return (
    <View style={styles.attachmentPreview}>
      {type === "image" ? (
        <Image source={{ uri }} style={styles.attachmentImage} />
      ) : (
        <View style={styles.videoPlaceholder}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.videoThumbnail} />
          ) : (
            <Text style={styles.videoPlaceholderText}>🎬</Text>
          )}
        </View>
      )}
      <TouchableOpacity style={styles.removeAttachment} onPress={onRemove}>
        <Text style={styles.removeAttachmentText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function ResultsScreen() {
  const router = useRouter();
  const { activityId, activityTitle } = useLocalSearchParams<{
    activityId: string;
    activityTitle: string;
  }>();
  const { teamId } = useTeam();

  useEffect(() => {
    console.log(
      `[ResultsScreen] Mounted with teamId: ${teamId}, activityId: ${activityId}`,
    );
  }, [teamId, activityId]);

  const [resultText, setResultText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  
  useEffect(() => {
    if (!teamId || !activityId) {
      console.log(
        "[ResultsScreen] Cannot load draft: missing teamId or activityId",
      );
      return;
    }
    loadDraft(teamId, activityId)
      .then((draft) => {
        if (draft) {
          console.log("[ResultsScreen] Draft loaded, updating state");
          setResultText(draft.resultText);
          setRating(draft.rating);
          setComment(draft.comment);
          setAttachments(draft.attachments);
        } else {
          console.log("[ResultsScreen] No draft found");
        }
      })
      .catch((err) => console.error("[ResultsScreen] loadDraft error:", err));
  }, [teamId, activityId]);

  const saveCurrentDraft = async () => {
    if (!teamId || !activityId) {
      console.log(
        "[ResultsScreen] Cannot save draft: missing teamId/activityId",
      );
      return;
    }
    console.log("[ResultsScreen] Saving draft...");
    await saveDraft({
      teamId,
      activityId,
      resultText,
      rating,
      comment,
      attachments: attachments.map(({ uri, type }) => ({ uri, type })),
    });
    console.log("[ResultsScreen] Draft saved");
  };

  const handleManualSave = async () => {
    await saveCurrentDraft();
    Alert.alert("Draft saved", "Your progress has been saved.");
  };

  const handleClose = async () => {
    console.log("[ResultsScreen] Closing modal, saving draft...");
    await saveCurrentDraft();
    router.back();
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant permission to access your photos and videos.",
      );
      return false;
    }
    return true;
  };

  const generateThumbnail = async (
    videoUri: string,
  ): Promise<string | undefined> => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 0,
        quality: 0.5,
      });
      return uri;
    } catch (error) {
      console.warn("Failed to generate video thumbnail", error);
      return undefined;
    }
  };

  const pickAttachment = async () => {
    if (!(await requestPermissions())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const type = asset.type === "video" ? "video" : "image";
      let thumbnail: string | undefined;
      if (type === "video") {
        thumbnail = await generateThumbnail(asset.uri);
      }
      setAttachments((prev) => [...prev, { uri: asset.uri, type, thumbnail }]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.sheet}>
            {/* Handle bar (optional, for consistency with BreathingPace) */}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Result Logging</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.subtitle}>
                {activityTitle || "Selected Activity"}
              </Text>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Result</Text>
                <TextInput
                  style={[styles.input, styles.textInput, {height:250}]}
                  placeholder="Enter your results..."
                  value={resultText}
                  onChangeText={setResultText}
                  multiline
                  textAlignVertical="top"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Attachments</Text>
                <TouchableOpacity
                  style={styles.attachmentButton}
                  onPress={pickAttachment}
                >
                  <Text style={styles.attachmentButtonText}>
                    + Add Attachment
                  </Text>
                </TouchableOpacity>
                {attachments.length > 0 && (
                  <View style={styles.attachmentList}>
                    {attachments.map((att, index) => (
                      <AttachmentPreview
                        key={`${att.uri}-${index}`}
                        attachment={att}
                        onRemove={() => removeAttachment(index)}
                      />
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionLabel, {marginBottom:0,}]}>Rating</Text>
                <StarRating rating={rating} onRatingChange={setRating} />
                {rating > 0 && (
                  <Text style={styles.ratingHint}>
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Comment / Reflection</Text>
                <TextInput
                  style={[styles.input, styles.commentInput]}
                  placeholder="Add any additional comments or reflections..."
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleManualSave}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleClose}
              >
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 10,
    paddingTop: 12,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    alignSelf: "center",
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dfe2e6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  closeBtnText: {
    fontSize: 18,
    color: "#000000",
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1e293b",
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0f172a",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    color: "#0f172a",
  },
  textInput: { minHeight: 120, textAlignVertical: "top" },
  commentInput: { minHeight: 80, textAlignVertical: "top" },
  attachmentButton: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  attachmentButtonText: { fontSize: 14, fontWeight: "800", color: "#353d49" },
  attachmentList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  attachmentPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentImage: { width: "100%", height: "100%", resizeMode: "cover" },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#cbd5e1",
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  videoPlaceholderText: { fontSize: 32 },
  removeAttachment: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removeAttachmentText: { color: "white", fontSize: 14, fontWeight: "bold" },
  starContainer: { flexDirection: "row", gap: 8, marginVertical: 8 },
  star: { fontSize: 32 },
  starFilled: { color: "#ffb700" },
  starEmpty: { color: "#cbd5e1" },
  ratingHint: { fontSize: 14, color: "#2563eb", marginTop: 4 },
  primaryButton: {
    width: "100%",
    height:55,
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButton: {
    width: "100%",
    height:55,
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  secondaryButtonText: { color: "#2563eb", fontSize: 16, fontWeight: "800" },
});
