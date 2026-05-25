import { useRouter } from "expo-router";
import HandFanActivity from "../../screens/HandFanActivity";

type SubmitParams = Record<string, string>;

export default function HandFanRoute() {
  const router = useRouter();

  return (
    <HandFanActivity
      onBack={() => router.back()}
      onSubmit={(params: SubmitParams = {}) =>
        router.push({
          pathname: "/results",
          params: {
            activityId: "A3",
            activityTitle: "Hand Fan Challenge",
            ...params,
          },
        })
      }
    />
  );
}