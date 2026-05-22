export type ActivityResultLogic = {
  score: number;
  feedback: string;
  performanceLevel: "Needs improvement" | "Good" | "Excellent";
};

function getRatingScore(ratingText: string) {
  const rating = Number(ratingText);

  if (Number.isNaN(rating)) {
    return 0;
  }

  return Math.min(Math.max(rating, 1), 5) * 10;
}

function getPerformanceLevel(score: number): ActivityResultLogic["performanceLevel"] {
  if (score >= 80) {
    return "Excellent";
  }

  if (score >= 50) {
    return "Good";
  }

  return "Needs improvement";
}

export function calculateActivityResult(
  activityId: string,
  measuredValueText: string,
  ratingText: string
): ActivityResultLogic {
  const measuredValue = Number(measuredValueText);
  const ratingScore = getRatingScore(ratingText);

  if (Number.isNaN(measuredValue)) {
    return {
      score: ratingScore,
      feedback: "Measured value was saved, but it was not a number for automatic calculation.",
      performanceLevel: getPerformanceLevel(ratingScore),
    };
  }

  if (activityId === "A1") {
    const fallTimeScore = Math.min(measuredValue * 20, 50);
    const score = Math.round(fallTimeScore + ratingScore);

    return {
      score,
      feedback:
        "Parachute result calculated from fall time and rating. Longer fall time usually means a slower, safer drop.",
      performanceLevel: getPerformanceLevel(score),
    };
  }

  if (activityId === "A2") {
    const safeSoundScore = measuredValue <= 70 ? 50 : Math.max(10, 50 - (measuredValue - 70));
    const score = Math.round(safeSoundScore + ratingScore);

    return {
      score,
      feedback:
        "Sound pollution result calculated from sound level and rating. Lower sound readings are treated as better.",
      performanceLevel: getPerformanceLevel(score),
    };
  }

  if (activityId === "A3") {
    const fanEffectScore = Math.min(measuredValue * 10, 50);
    const score = Math.round(fanEffectScore + ratingScore);

    return {
      score,
      feedback:
        "Hand fan result calculated from measured movement/effect and rating. Higher measured effect gives a higher score.",
      performanceLevel: getPerformanceLevel(score),
    };
  }

  return {
    score: ratingScore,
    feedback: "General activity result saved with rating-based score.",
    performanceLevel: getPerformanceLevel(ratingScore),
  };
}