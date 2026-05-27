export type MotionReading = {
  x: number;
  y: number;
  z: number;
};

export type BreathingCalculationResult = {
  movement: number;
  isBreathPeak: boolean;
  breathCount: number;
  currentBpm: number | null;
};

export type TiltCalculationResult = {
  xRotation: number;
  yRotation: number;
  zRotation: number;
  totalTilt: number;
  tiltStatus: string;
};

export type EarthquakeCalculationResult = {
  accelMagnitude: number;
  seismicStatus: string;
};

export type BreathingDetectionState = {
  smoothedZ: number;
  isMovingUp: boolean;
  hasInitialized: boolean;
  lastBreathTime: number;
  breathCount: number;
  startTime: number;
};

function runCalculation<T>(calculation: () => T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(calculation());
    }, 0);
  });
}

const ALPHA = 0.3;
const BREATH_THRESHOLD = 0.004;
const BREATH_MIN_INTERVAL_MS = 1500;
const BREATH_MAX_INTERVAL_MS = 8000;

export function processBreathingSample(
  state: BreathingDetectionState,
  z: number,
  currentTime: number,
): BreathingCalculationResult {
  let isBreathPeak = false;
  let breathCount = state.breathCount;
  let currentBpm: number | null = null;

  if (!state.hasInitialized) {
    state.smoothedZ = z;
    state.hasInitialized = true;
    return { movement: 0, isBreathPeak: false, breathCount, currentBpm: null };
  }

  const newSmoothedZ = ALPHA * z + (1 - ALPHA) * state.smoothedZ;
  const delta = newSmoothedZ - state.smoothedZ;

  if (delta > BREATH_THRESHOLD && !state.isMovingUp) {
    state.isMovingUp = true;
  } else if (delta < -BREATH_THRESHOLD && state.isMovingUp) {
    state.isMovingUp = false;

    const timeSinceLastBreath = currentTime - state.lastBreathTime;

    if (
      state.lastBreathTime === 0 ||
      (timeSinceLastBreath >= BREATH_MIN_INTERVAL_MS &&
        timeSinceLastBreath <= BREATH_MAX_INTERVAL_MS)
    ) {
      state.breathCount += 1;
      state.lastBreathTime = currentTime;
      breathCount = state.breathCount;
      isBreathPeak = true;

      const elapsedSec = (currentTime - state.startTime) / 1000;
      if (elapsedSec > 0 && state.breathCount >= 1) {
        const avgInterval = (elapsedSec * 1000) / state.breathCount;
        let bpm = Math.round((45000 / avgInterval) * 100) / 100;
        bpm = Math.min(45, Math.max(6, bpm));
        currentBpm = bpm;
      }
    }
  }

  state.smoothedZ = newSmoothedZ;

  return {
    movement: Number(delta.toFixed(5)),
    isBreathPeak,
    breathCount,
    currentBpm,
  };
}

export function createBreathingDetectionState(
  startTime?: number,
): BreathingDetectionState {
  return {
    smoothedZ: 0,
    isMovingUp: false,
    hasInitialized: false,
    lastBreathTime: 0,
    breathCount: 0,
    startTime: startTime || 0,
  };
}

export function resetBreathingDetectionState(
  state: BreathingDetectionState,
  newStartTime?: number,
): void {
  state.smoothedZ = 0;
  state.isMovingUp = false;
  state.hasInitialized = false;
  state.lastBreathTime = 0;
  state.breathCount = 0;
  state.startTime = newStartTime || 0;
}

export function estimateBreathsFromSamples(
  samples: number[],
  sampleIntervalMs: number,
  minIntervalMs: number = BREATH_MIN_INTERVAL_MS,
  maxIntervalMs: number = BREATH_MAX_INTERVAL_MS,
): number {
  if (samples.length < 10) return 0;

  const peaks: number[] = [];
  const windowSize = 15;

  for (let i = windowSize; i < samples.length - windowSize; i++) {
    let isPeak = true;
    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j !== i && samples[j] > samples[i]) {
        isPeak = false;
        break;
      }
    }
    if (isPeak) {
      const startIdx = Math.max(0, i - 30);
      const endIdx = Math.min(samples.length, i + 31);
      let localAvg = 0;
      for (let k = startIdx; k < endIdx; k++) {
        localAvg += samples[k];
      }
      localAvg /= endIdx - startIdx;

      if (samples[i] > localAvg + 0.005) {
        peaks.push(i);
      }
    }
  }

  const validPeaks: number[] = [];
  const minPeakDistance = minIntervalMs / sampleIntervalMs;
  const maxPeakDistance = maxIntervalMs / sampleIntervalMs;

  for (let i = 0; i < peaks.length; i++) {
    if (validPeaks.length === 0) {
      validPeaks.push(peaks[i]);
    } else {
      const distance = peaks[i] - validPeaks[validPeaks.length - 1];
      if (distance >= minPeakDistance && distance <= maxPeakDistance) {
        validPeaks.push(peaks[i]);
      }
    }
  }

  return Math.max(1, validPeaks.length);
}

export function calculateBpmFromBreathCount(
  breathCount: number,
  elapsedSeconds: number,
  minBpm: number = 6,
  maxBpm: number = 45,
): number {
  if (breathCount <= 0 || elapsedSeconds <= 0) return 0;
  const bpm = (breathCount / elapsedSeconds) * 60;
  return Math.min(maxBpm, Math.max(minBpm, parseFloat(bpm.toFixed(1))));
}

export function validateBreathCount(
  breathCount: number,
  elapsedSeconds: number,
  minBreathIntervalSec: number = 1.5,
  maxBreathIntervalSec: number = 8,
): number {
  const minPossibleBreaths = Math.floor(elapsedSeconds / maxBreathIntervalSec);
  const maxPossibleBreaths = Math.ceil(elapsedSeconds / minBreathIntervalSec);
  return Math.min(
    maxPossibleBreaths,
    Math.max(minPossibleBreaths, breathCount),
  );
}

export type ChartPoint = { x: number; y: number };

export type BreathingChartResult = {
  polyline: string;
  timeTicks: { x: number; label: string }[];
  gridYPositions: number[];
};

export type BreathingComparisonResult = {
  restPolyline: string;
  exercisePolyline: string;
  timeTicks: { x: number; label: string }[];
  gridYPositions: number[];
};

export function calculateBreathingChart(
  samples: number[],
  chartWidth: number,
  chartHeight: number,
  padTop: number,
  padBottom: number,
  padLeft: number,
  padRight: number,
  recordDurationSec: number,
  tickIntervalSec: number,
): Promise<BreathingChartResult> {
  return runCalculation(() => {
    if (samples.length < 2) {
      return { polyline: "", timeTicks: [], gridYPositions: [] };
    }
    const pw = chartWidth - padLeft - padRight;
    const ph = chartHeight - padTop - padBottom;

    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const range = max - min || 0.0001;

    const polyline = samples
      .map((v, i) => {
        const x = padLeft + (i / (samples.length - 1)) * pw;
        const y = padTop + ph - ((v - min) / range) * ph;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    const tickCount = Math.floor(recordDurationSec / tickIntervalSec);
    const timeTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
      const sec = i * tickIntervalSec;
      const x = padLeft + (sec / recordDurationSec) * pw;
      return { x: Number(x.toFixed(1)), label: `${sec}s` };
    });

    const gridYPositions = [0, 0.25, 0.5, 0.75, 1].map((frac) =>
      Number((padTop + ph * (1 - frac)).toFixed(1)),
    );

    return { polyline, timeTicks, gridYPositions };
  });
}

export function calculateBreathingComparison(
  restSamples: number[],
  exerciseSamples: number[],
  chartWidth: number,
  chartHeight: number,
  padTop: number,
  padBottom: number,
  padLeft: number,
  padRight: number,
  recordDurationSec: number,
  tickIntervalSec: number,
): Promise<BreathingComparisonResult> {
  return runCalculation(() => {
    const pw = chartWidth - padLeft - padRight;
    const ph = chartHeight - padTop - padBottom;

    const allVals = [...restSamples, ...exerciseSamples];
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    const range = max - min || 0.0001;

    const toPolyline = (samples: number[]) =>
      samples
        .map((v, i) => {
          const x = padLeft + (i / (samples.length - 1)) * pw;
          const y = padTop + ph - ((v - min) / range) * ph;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");

    const tickCount = Math.floor(recordDurationSec / tickIntervalSec);
    const timeTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
      const sec = i * tickIntervalSec;
      const x = padLeft + (sec / recordDurationSec) * pw;
      return { x: Number(x.toFixed(1)), label: `${sec}s` };
    });

    const gridYPositions = [0, 0.25, 0.5, 0.75, 1].map((frac) =>
      Number((padTop + ph * (1 - frac)).toFixed(1)),
    );

    return {
      restPolyline: restSamples.length > 1 ? toPolyline(restSamples) : "",
      exercisePolyline:
        exerciseSamples.length > 1 ? toPolyline(exerciseSamples) : "",
      timeTicks,
      gridYPositions,
    };
  });
}

export function calculateParachuteTilt(
  reading: MotionReading,
): Promise<TiltCalculationResult> {
  return runCalculation(() => {
    const xRotation = Number(reading.x.toFixed(3));
    const yRotation = Number(reading.y.toFixed(3));
    const zRotation = Number(reading.z.toFixed(3));

    const totalTilt =
      Math.abs(xRotation) + Math.abs(yRotation) + Math.abs(zRotation);

    let tiltStatus = "High tilt detected";
    if (totalTilt < 0.3) tiltStatus = "Stable drop";
    else if (totalTilt < 1.0) tiltStatus = "Moderate tilt";

    return { xRotation, yRotation, zRotation, totalTilt, tiltStatus };
  });
}

export function calculateSeismicVibration(
  reading: MotionReading,
): Promise<EarthquakeCalculationResult> {
  return runCalculation(() => {
    const magnitude = Math.sqrt(
      reading.x * reading.x + reading.y * reading.y + reading.z * reading.z,
    );

    const netForce = Math.abs(magnitude - 1.0);
    const accelMagnitude = Number(netForce.toFixed(2));

    let seismicStatus = "SENSOR ACTIVE";
    if (accelMagnitude > 0.6) seismicStatus = "SEVERE VIBRATION";
    else if (accelMagnitude > 0.18) seismicStatus = "MODERATE VIBRATION";
    else if (accelMagnitude > 0.05) seismicStatus = "LIGHT VIBRATION";

    return { accelMagnitude, seismicStatus };
  });
}

export type ReactionCalculationResult = {
  reactionTimeMs: number;
  reactionStatus: string;
  accuracyPercent: number;
  durationMs: number;
  traceStatus: string;
};

export function calculateReactionResult(
  input: Partial<{
    reactionTimeMs: number;
    accuracyPercent: number;
    durationMs: number;
  }>,
): Promise<ReactionCalculationResult> {
  return runCalculation(() => {
    const reactionTimeMs = input.reactionTimeMs ?? 0;
    const accuracyPercent = input.accuracyPercent ?? 0;
    const durationMs = input.durationMs ?? 0;

    let reactionStatus = "RECORDED";
    if (reactionTimeMs > 0) {
      if (reactionTimeMs < 200) reactionStatus = "EXCELLENT";
      else if (reactionTimeMs < 300) reactionStatus = "GOOD";
      else if (reactionTimeMs < 500) reactionStatus = "AVERAGE";
      else reactionStatus = "SLOW";
    }

    let traceStatus = "RECORDED";
    if (accuracyPercent > 0) {
      if (accuracyPercent >= 80) traceStatus = "EXCELLENT";
      else if (accuracyPercent >= 60) traceStatus = "GOOD";
      else if (accuracyPercent >= 40) traceStatus = "FAIR";
      else traceStatus = "POOR";
    }

    return {
      reactionTimeMs,
      reactionStatus,
      accuracyPercent,
      durationMs,
      traceStatus,
    };
  });
}
