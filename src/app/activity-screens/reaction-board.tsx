import { useRouter } from "expo-router";
import ReactionBoardScreen from "../../screens/ReactionBoard";

export default function humanPerformanceRoute() {
  const router = useRouter();

  return (
    <ReactionBoardScreen
      onBack={() => router.back()}
      onSubmit={() => router.back()}
    />
  );
}
