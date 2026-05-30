import * as Notifications from "expo-notifications";
import { collection, onSnapshot } from "firebase/firestore";
import { Alert } from "react-native";
import { db } from "./firebase";

type UpcomingChallengeData = {
  title?: string;
  name?: string;
  activityTitle?: string;
  activityId?: string;
  description?: string;
  startTime?: string;
  date?: string;
  time?: string;
};

export type UpcomingChallenge = {
  id: string;
  title: string;
  description: string;
  activityId?: string;
  startTime: string;
};

const UPCOMING_CHALLENGES_COLLECTION = "upcomingChallenges";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function showUpcomingChallengeNotification(
  title: string,
  startTime : string
) {
  const permission = await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "New Upcoming Challenge",
      body: `${title}\n\n${startTime}`,
    },
    trigger: null,
  });
}

function formatUpcomingChallenge(
  id: string,
  data: UpcomingChallengeData,
): UpcomingChallenge {
  const title =
    data.title || data.name || data.activityTitle || "Upcoming challenge";

  const startTime = data.startTime || data.date || data.time || "Time not set";

  const description =
    data.description || data.activityTitle || "Challenge details coming soon.";

  return {
    id,
    title,
    description,
    activityId: data.activityId,
    startTime,
  };
}

export function listenToUpcomingChallengesForHome(
  onChallengesChange: (challenges: UpcomingChallenge[]) => void,
  onError?: (message: string) => void,
) {
  return onSnapshot(
    collection(db, UPCOMING_CHALLENGES_COLLECTION),
    (snapshot) => {
      const challenges = snapshot.docs
        .map((doc) =>
          formatUpcomingChallenge(
            doc.id,
            doc.data() as UpcomingChallengeData,
          ),
        )
        .sort((a, b) => {
          const aTime = Date.parse(a.startTime);
          const bTime = Date.parse(b.startTime);

          if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
            return a.title.localeCompare(b.title);
          }

          return aTime - bTime;
        });

      onChallengesChange(challenges);
    },
    (error) => {
      console.log("Upcoming challenges home listener error:", error);
      onError?.("Unable to load upcoming challenges.");
    },
  );
}

export function startUpcomingChallengeListener() {
  let initialSnapshotLoaded = false;

  const unsubscribe = onSnapshot(
    collection(db, UPCOMING_CHALLENGES_COLLECTION),
    (snapshot) => {
      if (!initialSnapshotLoaded) {
        initialSnapshotLoaded = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type !== "added") {
          return;
        }

        const data = change.doc.data() as UpcomingChallengeData;

        const challengeTitle =
          data.title ||
          data.name ||
          data.activityTitle ||
          "New upcoming challenge";

        const challengeDescription =
          data.description ||
          data.startTime ||
          "A new upcoming challenge has been added.";

        void showUpcomingChallengeNotification(
          challengeTitle,
          challengeDescription
        );

        Alert.alert(
          "New Upcoming Challenge",
          `${challengeTitle}\n\n${challengeDescription}`
        );
      });
    },
    (error) => {
      console.log("Upcoming challenge listener error:", error);
    }
  );

  return unsubscribe;
}