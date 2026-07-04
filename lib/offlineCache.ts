import { openDB, type IDBPDatabase } from "idb";
import type { JSONContent } from "@tiptap/react";

interface CachedAnswer {
  attemptId: string;
  questionKey: string;
  content: JSONContent;
  updatedAt: number;
  synced: boolean;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB("exam-cache", 1, {
      upgrade(db) {
        db.createObjectStore("answers");
      },
    });
  }
  return dbPromise;
}

function key(attemptId: string, questionKey: string) {
  return `${attemptId}:${questionKey}`;
}

export async function cacheAnswerLocally(attemptId: string, questionKey: string, content: JSONContent) {
  const db = await getDb();
  const entry: CachedAnswer = { attemptId, questionKey, content, updatedAt: Date.now(), synced: false };
  await db.put("answers", entry, key(attemptId, questionKey));
}

export async function markAnswerSynced(attemptId: string, questionKey: string) {
  const db = await getDb();
  const k = key(attemptId, questionKey);
  const existing = (await db.get("answers", k)) as CachedAnswer | undefined;
  if (existing) await db.put("answers", { ...existing, synced: true }, k);
}

export async function getCachedAnswer(attemptId: string, questionKey: string) {
  const db = await getDb();
  return (await db.get("answers", key(attemptId, questionKey))) as CachedAnswer | undefined;
}

export async function getUnsyncedAnswers(attemptId: string): Promise<CachedAnswer[]> {
  const db = await getDb();
  const all = (await db.getAll("answers")) as CachedAnswer[];
  return all.filter((a) => a.attemptId === attemptId && !a.synced);
}
