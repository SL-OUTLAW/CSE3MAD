export type MotionReading = {
  x: number;
  y: number;
  z: number;
};

export type BreathingCalculationResult = {
  movement: number;
  isBreathPeak: boolean;
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

function runCalculation<T>(calculation: () => T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(calculation());
    }, 0);
  });
}

let smoothedZ = 0;
let isMovingUp = false;
let hasInitialized = false;

const ALPHA = 0.15;
const THRESHOLD = 0.004;

export function calculateBreathingMovement(
  reading: MotionReading,
  lastPeakTime: number,
  samples: number[],
): Promise<BreathingCalculationResult> {
  return runCalculation(() => {
    const currentZ = reading.z;

    if (!hasInitialized) {
      smoothedZ = currentZ;
      hasInitialized = true;
      return { movement: 0, isBreathPeak: false };
    }

    const newSmoothedZ = ALPHA * currentZ + (1 - ALPHA) * smoothedZ;
    const delta = newSmoothedZ - smoothedZ;
    const now = Date.now();
    let isBreathPeak = false;

    if (delta > THRESHOLD && !isMovingUp) {
      isMovingUp = true;
    } else if (delta < -THRESHOLD && isMovingUp) {
      if (now - lastPeakTime > 1500) {
        isMovingUp = false;
        isBreathPeak = true;
      }
    }

    smoothedZ = newSmoothedZ;

    return {
      movement: Number(delta.toFixed(5)),
      isBreathPeak,
    };
  });
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
    if (accelMagnitude > 0.8) seismicStatus = "SEVERE VIBRATION";
    else if (accelMagnitude > 0.3) seismicStatus = "MODERATE VIBRATION";
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
