import { useRouter } from "expo-router";
import ParachuteDropActivity from "../../screens/ParachuteDropActivity";

type SubmitParams = Record<string, string>;

export default function ParachuteDropRoute() {
  const router = useRouter();

  return (
    <ParachuteDropActivity
      onBack={() => router.back()}
      onSubmit={(params: SubmitParams = {}) =>
        router.push({
          pathname: "/results",
          params: {
            activityId: "A1",
            activityTitle: "Parachute Drop Challenge",
            ...params,
          },
        })
      }
    />
  );
}