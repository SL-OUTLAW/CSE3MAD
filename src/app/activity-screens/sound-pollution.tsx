import { useRouter } from "expo-router";
import SoundPollutionActivity from "../../screens/SoundPollutionActivity";

type SubmitParams = Record<string, string>;

export default function SoundPollutionRoute() {
  const router = useRouter();

  return (
    <SoundPollutionActivity
      onBack={() => router.back()}
      onSubmit={(params: SubmitParams = {}) =>
        router.push({
          pathname: "/results",
          params: {
            activityId: "A2",
            activityTitle: "Sound Pollution Hunter",
            ...params,
          },
        })
      }
    />
  );
}