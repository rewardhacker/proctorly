"use client";

import { useEffect, useRef } from "react";
import { logFocusEvent } from "@/lib/actions";

export default function FocusTracker({ attemptId }: { attemptId: string }) {
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        logFocusEvent(attemptId, "VISIBILITY_HIDDEN", new Date().toISOString());
      } else if (hiddenAt.current != null) {
        const durationMs = Date.now() - hiddenAt.current;
        hiddenAt.current = null;
        logFocusEvent(attemptId, "VISIBILITY_VISIBLE", new Date().toISOString(), durationMs);
      }
    }

    function block(type: "COPY_ATTEMPT" | "PASTE_ATTEMPT" | "CONTEXT_MENU_ATTEMPT") {
      return (e: Event) => {
        e.preventDefault();
        logFocusEvent(attemptId, type, new Date().toISOString());
      };
    }

    const onCopy = block("COPY_ATTEMPT");
    const onPaste = block("PASTE_ATTEMPT");
    const onCut = block("COPY_ATTEMPT");
    const onContextMenu = block("CONTEXT_MENU_ATTEMPT");

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("cut", onCut);
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [attemptId]);

  return null;
}
