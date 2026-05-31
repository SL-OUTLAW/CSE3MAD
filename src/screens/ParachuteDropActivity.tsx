import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useAccessibility } from "../../context/AccessibilityContext";

type SubmitParams = Record<string, string>;

type Props = {
  onBack: () => void;
  onLogResults: (params?: SubmitParams) => void;
  onSubmit: () => void;
};

function num(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

const G = 9.81;

export default function ParachuteDropActivity({ onBack, onLogResults, onSubmit }: Props) {
  const { colours, highContrast } = useAccessibility();
  const [attempt, setAttempt] = useState("");
  const [height, setHeight] = useState("");
  const [mass, setMass] = useState("");
  const [designNotes, setDesignNotes] = useState("");
  const [fallTime, setFallTime] = useState("");
  const [stopTime, setStopTime] = useState("");
  const [videoUri, setVideoUri] = useState("");
  const [bounced, setBounced] = useState(false);
  const [timeToMaxHeight, setTimeToMaxHeight] = useState("");

  
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
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

  useEffect(() => {
    if (videoUri) {
      setIsVideoLoading(true);
      setIsPlaying(false);
      setCurrentPosition(0);
      setVideoDuration(0);
      setPlaybackSpeed(1.0);
      const timer = setTimeout(() => setIsVideoLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [videoUri]);

  const result = useMemo(() => {
    const h = num(height);
    const m = num(mass);
    const fall = num(fallTime);
    const contact = num(stopTime);
    const tUp = num(timeToMaxHeight);

    const velocity = h > 0 && fall > 0 ? (2 * h) / fall : 0;
    const acceleration = fall > 0 ? velocity / fall : 0;
    const weightForce = m * G;
    const netForce = m * acceleration;
    const dragForce = Math.max(weightForce - netForce, 0);

    let deltaV = velocity;
    if (bounced && tUp > 0 && contact > 0) {
      const vUp = G * tUp;
      deltaV = velocity + vUp;
    }
    const gForce = contact > 0 ? deltaV / contact / G : 0;

    const status =
      fall <= 0
        ? "Enter slow-mo timing"
        : velocity < 1
          ? "Slow safe landing"
          : velocity < 2
            ? "Moderate landing"
            : "Fast landing";

    return {
      velocity,
      acceleration,
      weightForce,
      netForce,
      dragForce,
      gForce,
      deltaV,
      status,
    };
  }, [height, mass, fallTime, stopTime, bounced, timeToMaxHeight]);

  const recordVideo = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    
    if (videoRef.current) {
      await videoRef.current.pauseAsync();
    }
    const video = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      quality: 1,
      videoMaxDuration: 60,
    });
    if (!video.canceled) {
      setVideoUri(video.assets[0].uri);
    }
  };

  const chooseSlowMoVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow video access.");
      return;
    }
    if (videoRef.current) {
      await videoRef.current.pauseAsync();
    }
    const video = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
    });
    if (!video.canceled) {
      setVideoUri(video.assets[0].uri);
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = async (value: number) => {
    setPlaybackSpeed(value);
    if (videoRef.current) {
      await videoRef.current.setRateAsync(value, true);
    }
  };

  const handleSeek = async (value: number) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(value);
      setCurrentPosition(value);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setCurrentPosition(status.positionMillis);
      if (status.durationMillis) setVideoDuration(status.durationMillis);
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const handleLogResults = () => {
    onLogResults({
      defaultMeasuredValue: fallTime || "0",
      attempt,
      dropHeightM: height,
      toyMassKg: mass,
      designNotes,
      fallTimeSeconds: fallTime || "0",
      stopTimeSeconds: stopTime || "0",
      bounced: String(bounced),
      timeToMaxHeightSeconds: timeToMaxHeight || "0",
      finalVelocityMs: String(round(result.velocity)),
      accelerationMs2: String(round(result.acceleration)),
      weightForceN: String(round(result.weightForce)),
      netForceN: String(round(result.netForce)),
      dragForceN: String(round(result.dragForce)),
      gForce: String(round(result.gForce)),
      videoAttached: String(Boolean(videoUri)),
    });
  };

  return (
    <View
      style={[styles.outer, { backgroundColor: highContrast ? colours.background : "#f8f5ff" }]}
      >
        <KeyboardAvoidingView
  style={[
    styles.frame,
    { backgroundColor: highContrast ? colours.background : "#f8f5ff" },
  ]}
  behavior={Platform.OS === "ios" ? "padding" : undefined}
>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
  <View style={styles.heroIconBox}>
    <Text style={[styles.heroEmoji, { fontSize: 34 * colours.textScale }]}>
      🪂
    </Text>
  </View>

  <View style={styles.heroTextGroup}>
    <Text
      style={[
        styles.title,
        { color: colours.text, fontSize: 24 * colours.textScale },
      ]}
    >
      Parachute Drop{"\n"}Challenge
    </Text>

    <Text
      style={[
        styles.heroSubtitle,
        { color: colours.subText, fontSize: 14 * colours.textScale },
      ]}
    >
      Engineering • Physics
    </Text>
  </View>
</View>

          <View style={cardStyle}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>🎥</Text>
              <Text style={[styles.cardTitle, { color: colours.text, fontSize: 18 * colours.textScale }]}>Slow-motion Video Player</Text>
            </View>
            <Text style={[styles.helpText, { color: colours.subText, fontSize: 14 * colours.textScale }]}>
              Record or select a video to view in slow motion. {"\n"}Use the speed slider to slow down playback.
            </Text>

            {videoUri ? (
              <View style={styles.videoContainer}>
                {/* Force remount on URI change with key prop */}
                <Video
                  key={videoUri}
                  ref={videoRef}
                  source={{ uri: videoUri }}
                  rate={playbackSpeed}
                  isMuted={false}
                  shouldPlay={false}
                  isLooping={false}
                  useNativeControls={false}
                  resizeMode={ResizeMode.CONTAIN}
                  style={styles.video}
                  onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                  onLoad={() => setIsVideoLoading(false)}
                  onError={(error) => {
                    console.error("Video error:", error);
                    setIsVideoLoading(false);
                    Alert.alert("Error", "Failed to load video");
                  }}
                />
                {isVideoLoading && (
                  <View style={styles.loadingOverlay}>
                    <Text style={styles.loadingText}>Loading video...</Text>
                  </View>
                )}

                <View style={styles.timeContainer}>
                  <Text style={[styles.timeText, { color: colours.text, fontSize: 14 * colours.textScale }]}>{(currentPosition / 1000).toFixed(2)}s</Text>
                  <Text style={[styles.timeText, { color: colours.text, fontSize: 14 * colours.textScale }]}>{(videoDuration / 1000).toFixed(2)}s</Text>
                </View>

                <TouchableOpacity style={[styles.playButton, { backgroundColor: colours.primary }]} onPress={handlePlayPause}>                  
                  <Text style={styles.playButtonText}>{isPlaying ? "Pause" : "Play"}</Text>
                </TouchableOpacity>

                <View style={styles.sliderRow}>
                  <Text style={[styles.sliderLabel, { color: colours.text, fontSize: 14 * colours.textScale }]}>Seek</Text>
                  <Slider
                    style={[styles.slider, { marginRight: 45 }]}
                    minimumValue={0}
                    maximumValue={videoDuration}
                    value={currentPosition}
                    onSlidingComplete={handleSeek}
                    minimumTrackTintColor={colours.primary}
                    maximumTrackTintColor={colours.border}
                  />
                </View>

                <View style={styles.sliderRow}>
                  <Text style={[styles.sliderLabel, { color: colours.text, fontSize: 14 * colours.textScale }]}>Speed</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.1}
                    maximumValue={1.0}
                    step={0.01}
                    value={playbackSpeed}
                    onValueChange={handleSpeedChange}
                    minimumTrackTintColor={colours.primary}
                    maximumTrackTintColor={colours.border}
                  />
                  <Text style={[styles.speedText, { color: colours.primary, fontSize: 14 * colours.textScale }]}>{playbackSpeed.toFixed(2)}x</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.videoStatus, { color: colours.subText, fontSize: 14 * colours.textScale }]}>No video attached yet</Text>
            )}

            <View style={[styles.row, { marginTop: 20 }]}>
              <TouchableOpacity
                style={[
                  styles.outlineButton,
                  {
                    borderColor: colours.primary,
                    borderWidth: highContrast ? 3 : 1,
                  },
                ]}
                onPress={recordVideo}
              >
                <Text
                  style={[
                    styles.outlineButtonText,
                    { color: colours.primary, fontSize: 15 * colours.textScale },
                  ]}
                >
                  Record Video
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.outlineButton,
                  {
                    borderColor: colours.primary,
                    borderWidth: highContrast ? 3 : 1,
                  },
                ]}
                onPress={chooseSlowMoVideo}
              >
                <Text
                  style={[
                    styles.outlineButtonText,
                    { color: colours.primary, fontSize: 15 * colours.textScale },
                  ]}
                >
                  Choose Video
                </Text>
              </TouchableOpacity>
            </View>

            
          </View>

          <View style={cardStyle}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>📏</Text>
              <Text style={[styles.cardTitle, { color: colours.text, fontSize: 18 * colours.textScale }]}>Measurements</Text>
            </View>
            <Text style={[styles.label, { color: colours.text, fontSize: 14 * colours.textScale }]}>Drop height (m)</Text>
            <TextInput
              style={inputStyle}
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 1.2"
              placeholderTextColor={colours.subText}
            />

            <Text style={[styles.label, { color: colours.text, fontSize: 14 * colours.textScale }]}>Mass (kg)</Text>
            <TextInput
              style={inputStyle}
              value={mass}
              onChangeText={setMass}
              keyboardType="decimal-pad"
              placeholder="e.g. 0.05"
              placeholderTextColor={colours.subText}
            />

            <Text style={[styles.label, { color: colours.text, fontSize: 14 * colours.textScale }]}>Time to first hit ground (s)</Text>
            <TextInput
              style={inputStyle}
              value={fallTime}
              onChangeText={setFallTime}
              keyboardType="decimal-pad"
              placeholder="e.g. 0.5"
              placeholderTextColor={colours.subText}
            />

            <Text style={[styles.label, { color: colours.text, fontSize: 14 * colours.textScale }]}>Contact time (first hit → stop) (s)</Text>
            <TextInput
              style={inputStyle}
              value={stopTime}
              onChangeText={setStopTime}
              keyboardType="decimal-pad"
              placeholder="e.g. 0.05"
              placeholderTextColor={colours.subText}
            />

            <View style={[styles.switchRow, { marginBottom: 5 }]}>
              <Text style={[styles.label, { color: bounced ? colours.primary : colours.text, fontSize: 14 * colours.textScale }]}>Bounce</Text>
              <Switch value={bounced} onValueChange={setBounced} />
            </View>

            {bounced && (
              <>
                <Text style={[styles.label, { color: colours.text, fontSize: 14 * colours.textScale }]}>Time from separation to maximum height (s)</Text>
                <TextInput
                  style={inputStyle}
                  value={timeToMaxHeight}
                  onChangeText={setTimeToMaxHeight}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 0.15"
                  placeholderTextColor={colours.subText}
                />
              </>
            )}
          </View>

          <View style={[cardStyle, { marginBottom: 40 }]}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>📊</Text>
              <Text style={[styles.cardTitle, { color: colours.text, fontSize: 18 * colours.textScale }]}>Calculated Results</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.metric}>
                <Text style={[styles.metricValue, { color: colours.primary, fontSize: 24 * colours.textScale }]}>{round(result.velocity)} m/s</Text>
                <Text style={[styles.metricLabel, { color: colours.text, fontSize: 14 * colours.textScale }]}>Impact Velocity</Text>
              </View>
              <View style={styles.metric}>
                <Text style={[styles.metricValue, { color: colours.primary, fontSize: 24 * colours.textScale }]}>{round(result.gForce)}g</Text>
                <Text style={[styles.metricLabel, { color: colours.text, fontSize: 14 * colours.textScale }]}>G-force</Text>
              </View>
            </View>
            <Text style={[styles.resultText, { color: colours.text, fontSize: 15 * colours.textScale }]}>Acceleration: {round(result.acceleration)} m/s²</Text>
            <Text style={[styles.resultText, { color: colours.text, fontSize: 15 * colours.textScale }]}>Weight force: {round(result.weightForce)} N</Text>
            <Text style={[styles.resultText, { color: colours.text, fontSize: 15 * colours.textScale }]}>Net force: {round(result.netForce)} N</Text>
            <Text style={[styles.resultText, { color: colours.text, fontSize: 15 * colours.textScale }]}>Drag force: {round(result.dragForce)} N</Text>
            {bounced && (
              <Text style={[styles.resultText, { color: colours.text, fontSize: 15 * colours.textScale }]}>Δv (impact + upward): {round(result.deltaV)} m/s</Text>
            )}
          </View>

          <TouchableOpacity style={[styles.logButton, { backgroundColor: "#7c3aed", borderColor: "#7c3aed", borderWidth: highContrast ? 3 : 1 }]} onPress={handleLogResults}>
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
  title: { fontSize: 24, fontWeight: "900", color: "#18181b", lineHeight: 32 },
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
  cardTitle: { fontSize: 18, color: "#18181b", fontWeight: "900" },
  helpText: { fontSize: 14, color: "#64748b", lineHeight: 20, marginBottom: 12 },
  row: { flexDirection: "row", gap: 10 },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",  
  },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#7c3aed",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  outlineButtonText: { color: "#7c3aed", fontSize: 15, fontWeight: "900" },
  videoStatus: { fontSize: 14, color: "#ff0000", fontWeight: "700", marginTop: 10, marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 14,
    color: "#18181b",
    backgroundColor: "#fafafa",
  },
  metric: { flex: 1, alignItems: "center", marginBottom: 12 },
  metricValue: { fontSize: 24, fontWeight: "800", color: "#1d5db1" },
  metricLabel: { fontSize: 14, color: "#000000", fontWeight: "800" },
  resultText: { fontSize: 15, color: "#1f2937", marginBottom: 6, fontWeight: "600" },
  status: { fontSize: 15, color: "#1d5db1", fontWeight: "800", marginTop: 4 },
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
    color: "#7c3aed",
    textAlign: "center",
    flex: 1,
  },
  arrowIcon: {
    fontSize: 20,
    color: "#7c3aed",
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
  videoContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#000",
  },
  playButton: {
    marginTop: 20,
    width: "100%",
    backgroundColor: "#1d5db1",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  playButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    width: "100%",
  },
  sliderLabel: {
    width: 45,
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 14,
    color: "#000000",
  },
  speedText: {
    width: 45,
    fontSize: 14,
    fontWeight: "800",
    color: "#1d5db1",
    textAlign: "right",
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  heroCard: {
  backgroundColor: "#ffffff",
  borderRadius: 26,
  padding: 18,
  marginBottom: 20,
  flexDirection: "row",
  alignItems: "center",
  gap: 18,
  borderWidth: 1,
  borderColor: "#ede9fe",
  shadowColor: "#312e81",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 3,
},
heroIconBox: {
  width: 76,
  height: 76,
  borderRadius: 22,
  backgroundColor: "#f5f3ff",
  alignItems: "center",
  justifyContent: "center",
},
heroEmoji: {
  textAlign: "center",
},
heroTextGroup: {
  flex: 1,
},
heroSubtitle: {
  fontWeight: "800",
  marginTop: 4,
},
sectionTitleRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 12,
},
sectionEmoji: {
  fontSize: 24,
  marginRight: 10,
},
});