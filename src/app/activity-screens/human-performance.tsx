import { useRouter } from "expo-router";
import HumanPerformanceLabScreen from "../../screens/HumanPerformance";

export default function humanPerformanceRoute() {
  const router = useRouter();

  return (
    <HumanPerformanceLabScreen
      onBack={() => router.back()}
      onSubmit={() => router.back()}
    />
  );
}
