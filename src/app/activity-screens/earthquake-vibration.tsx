import { useRouter } from "expo-router";
import EarthquakeDetectionScreen from "../../screens/EarthquakeVibration";

export default function earthquakeVibrationRoute() {
  const router = useRouter();

  return (
    <EarthquakeDetectionScreen
      onBack={() => router.back()}
      onSubmit={() => router.back()}
    />
  );
}
