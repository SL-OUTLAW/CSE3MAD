import * as Battery from "expo-battery";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const LOW_BATTERY_LIMIT = 20;

let warningSent = false;

Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }) as Notifications.NotificationBehavior,
});

async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();

  if (current.status === "granted") {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

async function sendLowBatteryNotification(percent: number) {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Low Battery",
      body: `Battery is ${percent}%. Please charge your phone before continuing.`,
      sound: "default",
    },
    trigger: null,
  });
}

async function handleBatteryLevel(level: number) {
  const percent = Math.round(level * 100);

  if (percent < LOW_BATTERY_LIMIT && !warningSent) {
    warningSent = true;
    await sendLowBatteryNotification(percent);
  }

  if (percent >= LOW_BATTERY_LIMIT) {
    warningSent = false;
  }

  return percent;
}

export async function checkBatteryLevel() {
  const level = await Battery.getBatteryLevelAsync();
  return handleBatteryLevel(level);
}

export async function startBatteryWarningService() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("battery-warning", {
      name: "Battery Warning",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }

  await checkBatteryLevel();

  const subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
    void handleBatteryLevel(batteryLevel);
  });

  return subscription;
}