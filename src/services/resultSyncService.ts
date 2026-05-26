import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type ResultPayload = {
  teamId?: string;
  activityId?: string;
  activityTitle?: string;
  measuredValue: string;
  rating: string;
  comment: string;
  attemptNumber?: number;
  timestamp?: number;
  latitude?: number | null;
  longitude?: number | null;
};

export async function syncResult(result: ResultPayload) {
  await addDoc(collection(db, "results"), {
    teamId: result.teamId ?? "",
    activityId: result.activityId ?? "",
    activityTitle: result.activityTitle ?? "",
    measuredValue: result.measuredValue.trim(),
    rating: result.rating.trim(),
    comment: result.comment.trim(),
    submittedAt: serverTimestamp(),
    syncStatus: "synced",
    attemptNumber: result.attemptNumber ?? null,
    localTimestamp: result.timestamp ?? null,
    latitude: result.latitude ?? null,
    longitude: result.longitude ?? null,
  });
}
