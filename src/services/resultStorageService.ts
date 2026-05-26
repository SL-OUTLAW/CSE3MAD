import * as SQLite from "expo-sqlite";
import { Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { syncResult } from "./resultSyncService";

const db = SQLite.openDatabaseSync("offline_results.db");

export const initDatabase = () => {
  db.execAsync(`
    CREATE TABLE IF NOT EXISTS activity_results (
      teamId TEXT NOT NULL,
      activityId TEXT NOT NULL,
      activityTitle TEXT NOT NULL,
      attemptNumber INTEGER NOT NULL,
      resultText TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      latitude REAL,
      longitude REAL, 
      syncedToFirebase INTEGER DEFAULT 0,
      attachmentUris TEXT,
      PRIMARY KEY (teamId, activityId, attemptNumber)
    );
    
    CREATE TABLE IF NOT EXISTS result_drafts (
      teamId TEXT NOT NULL,
      activityId TEXT NOT NULL,
      resultText TEXT,
      rating INTEGER,
      comment TEXT,
      attachments TEXT,
      PRIMARY KEY (teamId, activityId)
    );
  `);
  console.log("[initDatabase] Tables created with correct schema");
};

async function copyAttachmentToAppDir(
  sourceUri: string,
  teamId: string,
  activityId: string,
  attemptNumber: number,
  fileType: "image" | "video",
): Promise<string> {
  
  const documentDir = Paths.document.uri;
  if (!documentDir) {
    throw new Error("App document directory is not available");
  }

  const extension =
    sourceUri.split(".").pop() || (fileType === "image" ? "jpg" : "mp4");
  const destDir = `${documentDir}results_attachments/${teamId}/${activityId}/${attemptNumber}/`;
  const destPath = `${destDir}${Date.now()}.${extension}`;

  
  await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
  await FileSystem.copyAsync({ from: sourceUri, to: destPath });

  return destPath;
}

async function getNextAttemptNumber(
  teamId: string,
  activityId: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ maxAttempt: number }>(
    `SELECT MAX(attemptNumber) as maxAttempt FROM activity_results WHERE teamId = ? AND activityId = ?`,
    [teamId, activityId],
  );
  return (result?.maxAttempt || 0) + 1;
}

export async function saveResultOffline(params: {
  teamId: string;
  activityId: string;
  activityTitle: string;
  resultText: string;
  rating: number;
  comment: string;
  attachments: { uri: string; type: "image" | "video" }[];
  latitude?: number | null;
  longitude?: number | null;
}) {
  const {
    teamId,
    activityId,
    activityTitle,
    resultText,
    rating,
    comment,
    attachments,
    latitude,
    longitude,
  } = params;
  const attemptNumber = await getNextAttemptNumber(teamId, activityId);

  const movedUris: string[] = [];
  for (const att of attachments) {
    const newUri = await copyAttachmentToAppDir(
      att.uri,
      teamId,
      activityId,
      attemptNumber,
      att.type,
    );
    movedUris.push(newUri);
  }

  const attachmentUrisJson = JSON.stringify(movedUris);
  const timestamp = Date.now();

  await db.runAsync(
    `INSERT INTO activity_results (teamId, activityId, activityTitle, attemptNumber, resultText, rating, comment, timestamp, latitude, longitude, attachmentUris, syncedToFirebase)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      teamId,
      activityId,
      activityTitle,
      attemptNumber,
      resultText,
      rating,
      comment,
      timestamp,
      latitude ?? null,
      longitude ?? null,
      attachmentUrisJson,
    ],
  );

  return { attemptNumber };
}

async function syncResultToFirebase(params: {
  teamId: string;
  activityId: string;
  activityTitle: string;
  attemptNumber: number;
  measuredValue: string;
  rating: string;
  comment: string;
  timestamp: number;
  latitude?: number | null;
  longitude?: number | null;
}) {
  await syncResult({
    teamId: params.teamId,
    activityId: params.activityId,
    activityTitle: params.activityTitle,
    measuredValue: params.measuredValue,
    rating: params.rating,
    comment: params.comment,
    attemptNumber: params.attemptNumber,
    timestamp: params.timestamp,
    latitude: params.latitude,
    longitude: params.longitude,
  });
}

export async function syncPendingResultsToFirebase() {
  const pending = await db.getAllAsync<{
    teamId: string;
    activityId: string;
    activityTitle: string;
    attemptNumber: number;
    resultText: string;
    rating: number;
    comment: string;
    timestamp: number;
    latitude?: number | null;
    longitude?: number | null;
  }>(
    `SELECT teamId, activityId, activityTitle, attemptNumber, resultText, rating, comment, timestamp, latitude, longitude
     FROM activity_results WHERE syncedToFirebase = 0`,
  );

  for (const row of pending) {
    try {
      await syncResultToFirebase({
        teamId: row.teamId,
        activityId: row.activityId,
        activityTitle: row.activityTitle,
        attemptNumber: row.attemptNumber,
        measuredValue: row.resultText,
        rating: row.rating.toString(),
        comment: row.comment,
        timestamp: row.timestamp,
        latitude: row.latitude,
        longitude: row.longitude,
      });

      await db.runAsync(
        `UPDATE activity_results SET syncedToFirebase = 1 WHERE teamId = ? AND activityId = ? AND attemptNumber = ?`,
        [row.teamId, row.activityId, row.attemptNumber],
      );
    } catch (error) {
      console.error("Sync failed for", row, error);
    }
  }
}


export async function saveDraft(params: {
  teamId: string;
  activityId: string;
  resultText: string;
  rating: number;
  comment: string;
  attachments: { uri: string; type: "image" | "video" }[];
}) {
  const { teamId, activityId, resultText, rating, comment, attachments } =
    params;
  console.log(
    `[saveDraft] Saving draft for team ${teamId}, activity ${activityId}`,
  );
  const attachmentsJson = JSON.stringify(attachments);
  await db.runAsync(
    `INSERT OR REPLACE INTO result_drafts (teamId, activityId, resultText, rating, comment, attachments)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [teamId, activityId, resultText, rating, comment, attachmentsJson],
  );
  console.log(`[saveDraft] Draft saved successfully`);
}

export async function loadDraft(teamId: string, activityId: string) {
  console.log(
    `[loadDraft] Loading draft for team ${teamId}, activity ${activityId}`,
  );
  const draft = await db.getFirstAsync<{
    resultText: string;
    rating: number;
    comment: string;
    attachments: string;
  }>(
    `SELECT resultText, rating, comment, attachments FROM result_drafts
     WHERE teamId = ? AND activityId = ?`,
    [teamId, activityId],
  );
  if (!draft) {
    console.log(`[loadDraft] No draft found`);
    return null;
  }
  console.log(`[loadDraft] Draft loaded`);
  return {
    resultText: draft.resultText,
    rating: draft.rating,
    comment: draft.comment,
    attachments: JSON.parse(draft.attachments) as {
      uri: string;
      type: "image" | "video";
    }[],
  };
}

export async function clearDraft(teamId: string, activityId: string) {
  console.log(
    `[clearDraft] Clearing draft for team ${teamId}, activity ${activityId}`,
  );
  await db.runAsync(
    `DELETE FROM result_drafts WHERE teamId = ? AND activityId = ?`,
    [teamId, activityId],
  );
}
