import { collection, onSnapshot } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import { Alert } from "react-native";
import { db } from "./firebase";

type UpcomingChallengeData = {
  title?: string;
  name?: string;
  activityTitle?: string;
  description?: string;
  startTime?: string;
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
  description: string
) {
  const permission = await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "New Upcoming Challenge",
      body: `${title}\n${description}`,
    },
    trigger: null,
  });
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