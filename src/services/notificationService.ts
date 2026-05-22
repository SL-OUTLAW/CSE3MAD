import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const isExpoGo = Constants.appOwnership === "expo";

export type PushRegistrationResult = {
  token: string | null;
  status: "granted" | "denied" | "unavailable" | "error";
  message: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return {
      token: null,
      status: "unavailable",
      message: "Push notifications require a physical device.",
    };
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermission.status;

  if (finalStatus !== "granted") {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== "granted") {
    return {
      token: null,
      status: "denied",
      message: "Notification permission was not granted.",
    };
  }
  
  if (Platform.OS === "android" && isExpoGo) {
  return {
    token: null,
    status: "unavailable",
    message: "Remote push notifications require a development build on Android.",
  };
}

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563eb",
    });
  }

  try {
    const projectId = getProjectId();

    if (!projectId) {
      return {
        token: null,
        status: "unavailable",
        message: "Project ID is not configured for push token registration.",
      };
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return {
      token: tokenResponse.data,
      status: "granted",
      message: "Push notification token registered.",
    };
  } catch (error) {
    console.error(error);

    return {
      token: null,
      status: "error",
      message: "Could not register push notification token.",
    };
  }
}

export function addNotificationHandlers(
  onReceive: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void
) {
  const receivedSubscription =
    Notifications.addNotificationReceivedListener(onReceive);

  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}