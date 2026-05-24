import { calculateParachuteResult } from "./activityOneParachuteResultService";
import { calculateSoundResult } from "./activityTwoSoundResultService";
import { calculateFanResult } from "./activityThreeFanResultService";

export type ActivityResultLogic = {
  score: number;
  feedback: string;
  performanceLevel: "Needs improvement" | "Good" | "Excellent";
  calculationData: Record<string, string | number>;
};

export function getRatingScore(ratingText: string): number {
  const rating = Number(ratingText);

  if (Number.isNaN(rating) || rating <= 0) {
    return 0;
  }

  return Math.min(Math.max(rating, 1), 5) * 10;
}

export function getPerformanceLevel(
  score: number
): ActivityResultLogic["performanceLevel"] {
  if (score >= 80) {
    return "Excellent";
  }

  if (score >= 50) {
    return "Good";
  }

  return "Needs improvement";
}

export function toNumber(value: string): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function round(value: number, decimals = 2): number {
  return Number(value.toFixed(decimals));
}

export function calculateActivityResult(
  activityId: string,
  measuredValueText: string,
  ratingText: string
): ActivityResultLogic {
  if (activityId === "A1") {
    return calculateParachuteResult(measuredValueText, ratingText);
  }

  if (activityId === "A2") {
    return calculateSoundResult(measuredValueText, ratingText);
  }

  if (activityId === "A3") {
    return calculateFanResult(measuredValueText, ratingText);
  }

  const ratingScore = getRatingScore(ratingText);

  return {
    score: ratingScore,
    feedback: "General activity result saved with rating-based score.",
    performanceLevel: getPerformanceLevel(ratingScore),
    calculationData: {},
  };
}