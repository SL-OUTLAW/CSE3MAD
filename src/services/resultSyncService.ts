import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type CalculationData = Record<string, string | number | boolean>;

export type ResultPayload = {
  teamId?: string;
  activityId?: string;
  activityTitle?: string;
  measuredValue: string;
  rating: string;
  comment: string;
  calculatedScore?: number;
  performanceLevel?: string;
  feedback?: string;
  calculationData?: CalculationData;
};

export async function syncResult(result: ResultPayload) {
  await addDoc(collection(db, "results"), {
    teamId: result.teamId ?? "",
    activityId: result.activityId ?? "",
    activityTitle: result.activityTitle ?? "",
    measuredValue: result.measuredValue.trim(),
    rating: result.rating.trim(),
    comment: result.comment.trim(),
    calculatedScore: result.calculatedScore ?? 0,
    performanceLevel: result.performanceLevel ?? "Not calculated",
    feedback: result.feedback ?? "",
    calculationData: result.calculationData ?? {},
    submittedAt: serverTimestamp(),
    syncStatus: "synced",
  });
}