import {
  ActivityResultLogic,
  getPerformanceLevel,
  getRatingScore,
  round,
  toNumber,
} from "./activityResultLogicService";

export function calculateFanResult(
  measuredValueText: string,
  ratingText: string
): ActivityResultLogic {
  const bendAngleDeg = toNumber(measuredValueText);

  if (bendAngleDeg <= 0) {
    const ratingScore = getRatingScore(ratingText);

    return {
      score: ratingScore,
      feedback: "Bend angle must be a positive number.",
      performanceLevel: getPerformanceLevel(ratingScore),
      calculationData: {},
    };
  }

  const bendAngleRad = bendAngleDeg * (Math.PI / 180);
  const assumedPaperStiffnessNPerRad = 0.05;
  const estimatedForceN = assumedPaperStiffnessNPerRad * bendAngleRad;

  const bendScore = Math.min(bendAngleDeg, 50);
  const score = Math.min(
    Math.round(bendScore + getRatingScore(ratingText)),
    100
  );

  return {
    score,
    performanceLevel: getPerformanceLevel(score),
    feedback:
      "Hand fan result uses bend angle to estimate relative air force. A larger bend angle means stronger air movement from the fan design.",
    calculationData: {
      bendAngleDeg: round(bendAngleDeg),
      bendAngleRad: round(bendAngleRad),
      assumedPaperStiffnessNPerRad,
      estimatedForceN: round(estimatedForceN, 4),
      distanceEffect:
        "Closer fan distance should usually create stronger air movement and larger bend angle.",
      materialStiffnessComment:
        "Paper bends more easily than cardboard because it has lower stiffness.",
    },
  };
}