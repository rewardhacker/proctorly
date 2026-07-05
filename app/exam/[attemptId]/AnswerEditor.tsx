"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { saveAnswer } from "@/lib/actions";
import { cacheAnswerLocally, getCachedAnswer, getUnsyncedAnswers, markAnswerSynced } from "@/lib/offlineCache";

type Status = "synced" | "local" | "offline";

export default function AnswerEditor({
  attemptId,
  questionKey,
  initialContent,
}: {
  attemptId: string;
  questionKey: string;
  initialContent: JSONContent | null;
}) {
  const [status, setStatus] = useState<Status>("synced");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function trySync(content: JSONContent) {
    try {
      await saveAnswer(attemptId, questionKey, content);
      await markAnswerSynced(attemptId, questionKey);
      setStatus("synced");
    } catch {
      setStatus(navigator.onLine ? "local" : "offline");
    }
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "min-h-[280px] w-full select-text rounded border p-3 focus:outline-none" },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      setStatus(navigator.onLine ? "local" : "offline");
      cacheAnswerLocally(attemptId, questionKey, content);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => trySync(content), 1000);
    },
  });

  // Hydrate from IndexedDB if there's an unsynced edit newer than the
  // server value (e.g. the tab closed before a sync completed).
  useEffect(() => {
    if (!editor) return;
    getCachedAnswer(attemptId, questionKey).then((cached) => {
      if (cached && !cached.synced) {
        editor.commands.setContent(cached.content);
        setStatus(navigator.onLine ? "local" : "offline");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Background retry loop: flush any unsynced entry when connectivity
  // returns, without waiting for the next keystroke.
  useEffect(() => {
    function onOnline() {
      getUnsyncedAnswers(attemptId).then((entries) => {
        const mine = entries.find((e) => e.questionKey === questionKey);
        if (mine) trySync(mine.content);
      });
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, questionKey]);

  return (
    <div>
      <EditorContent editor={editor} />
      <p className="mt-1 h-4 text-xs text-gray-500">
        {status === "local" && "Saving locally, syncing…"}
        {status === "offline" && "Offline – saved on this device, will sync when reconnected"}
        {status === "synced" && "Saved"}
      </p>
    </div>
  );
}
