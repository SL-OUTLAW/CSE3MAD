import {
  ActivityResultLogic,
  getPerformanceLevel,
  getRatingScore,
  round,
  toNumber,
} from "./activityResultLogicService";

function getSoundRiskLevel(db: number): string {
  if (db < 30) return "No risk";
  if (db < 60) return "Safe for long periods";
  if (db < 85) return "Generally safe, but long exposure can cause fatigue";
  if (db < 90) return "Hearing damage possible after long exposure";
  if (db < 100) return "Hearing damage likely after short exposure";
  if (db < 110) return "Serious hearing damage in minutes";
  if (db < 120) return "Painful; immediate damage possible";
  if (db < 130) return "Immediate and severe hearing damage";
  return "Instant, permanent hearing damage risk";
}

export function calculateSoundResult(
  measuredValueText: string,
  ratingText: string
): ActivityResultLogic {
  const soundLevelDb = toNumber(measuredValueText);

  if (soundLevelDb <= 0) {
    const ratingScore = getRatingScore(ratingText);

    return {
      score: ratingScore,
      feedback: "Sound level must be a positive dB value.",
      performanceLevel: getPerformanceLevel(ratingScore),
      calculationData: {},
    };
  }

  const riskLevel = getSoundRiskLevel(soundLevelDb);

  const soundSafetyScore =
    soundLevelDb <= 60
      ? 50
      : soundLevelDb <= 85
        ? 40
        : soundLevelDb <= 90
          ? 30
          : soundLevelDb <= 100
            ? 20
            : 10;

  const score = Math.min(
    Math.round(soundSafetyScore + getRatingScore(ratingText)),
    100
  );

  return {
    score,
    performanceLevel: getPerformanceLevel(score),
    feedback:
      "Sound pollution result uses the recorded dB value to identify hearing risk and recommend safer classroom noise levels.",
    calculationData: {
      soundLevelDb: round(soundLevelDb),
      riskLevel,
      recommendation:
        soundLevelDb >= 85
          ? "Noise is high. Reduce exposure time or use hearing protection."
          : "Noise level is acceptable for normal classroom activity.",
    },
  };
}