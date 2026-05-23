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

export function calculateBreathingMovement(
  reading: MotionReading,
  lastPeakTime: number,
): Promise<BreathingCalculationResult> {
  return runCalculation(() => {
    const totalMovement = Math.sqrt(
      reading.x * reading.x + reading.y * reading.y + reading.z * reading.z,
    );

    const now = Date.now();
    const isBreathPeak = totalMovement > 1.08 && now - lastPeakTime > 2500;

    return {
      movement: Number(totalMovement.toFixed(3)),
      isBreathPeak,
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

    if (totalTilt < 0.3) {
      tiltStatus = "Stable drop";
    } else if (totalTilt < 1.0) {
      tiltStatus = "Moderate tilt";
    }

    return {
      xRotation,
      yRotation,
      zRotation,
      totalTilt,
      tiltStatus,
    };
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
    if (accelMagnitude > 0.8) {
      seismicStatus = "SEVERE VIBRATION";
    } else if (accelMagnitude > 0.3) {
      seismicStatus = "MODERATE VIBRATION";
    } else if (accelMagnitude > 0.05) {
      seismicStatus = "LIGHT VIBRATION";
    }

    return {
      accelMagnitude,
      seismicStatus,
    };
  });
}
