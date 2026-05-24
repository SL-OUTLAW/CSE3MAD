import {
  ActivityResultLogic,
  getPerformanceLevel,
  getRatingScore,
  round,
  toNumber,
} from "./activityResultLogicService";

export function calculateParachuteResult(
  measuredValueText: string,
  ratingText: string
): ActivityResultLogic {
  const fallTimeSeconds = toNumber(measuredValueText);
  const assumedDropHeightM = 1;
  const assumedToyMassKg = 0.2;

  if (fallTimeSeconds <= 0) {
    const ratingScore = getRatingScore(ratingText);

    return {
      score: ratingScore,
      feedback:
        "Fall time must be a positive number for the parachute calculation.",
      performanceLevel: getPerformanceLevel(ratingScore),
      calculationData: {},
    };
  }

  const finalVelocityMS = (2 * assumedDropHeightM) / fallTimeSeconds;
  const accelerationMS2 = finalVelocityMS / fallTimeSeconds;
  const weightForceN = assumedToyMassKg * 9.81;
  const netForceN = assumedToyMassKg * accelerationMS2;
  const dragForceN = Math.max(weightForceN - netForceN, 0);

  const fallTimeScore = Math.min(fallTimeSeconds * 20, 50);
  const score = Math.min(
    Math.round(fallTimeScore + getRatingScore(ratingText)),
    100
  );

  return {
    score,
    performanceLevel: getPerformanceLevel(score),
    feedback:
      "Parachute result uses fall time to estimate landing speed, acceleration, net force, and drag. A longer fall time means a slower and safer drop.",
    calculationData: {
      fallTimeSeconds: round(fallTimeSeconds),
      assumedDropHeightM,
      assumedToyMassKg,
      finalVelocityMS: round(finalVelocityMS),
      accelerationMS2: round(accelerationMS2),
      weightForceN: round(weightForceN),
      netForceN: round(netForceN),
      dragForceN: round(dragForceN),
    },
  };
}