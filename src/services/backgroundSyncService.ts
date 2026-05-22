import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

const RESULT_SYNC_TASK = "result-background-sync";

TaskManager.defineTask(RESULT_SYNC_TASK, async () => {
  try {
    console.log("Background result sync task ran.");

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error("Background result sync task failed:", error);

    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundResultSync() {
  const status = await BackgroundTask.getStatusAsync();

  if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
    console.log("Background sync is not available:", status);
    return false;
  }

  await BackgroundTask.registerTaskAsync(RESULT_SYNC_TASK, {
    minimumInterval: 15,
  });

  console.log("Background result sync registered.");
  return true;
}

export async function triggerBackgroundSyncTest() {
  await BackgroundTask.triggerTaskWorkerForTestingAsync();
}