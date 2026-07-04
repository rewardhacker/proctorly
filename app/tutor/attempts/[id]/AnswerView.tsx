"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function AnswerView({ content }: { content: JSONContent | null }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content ?? "<p><em>(no answer submitted)</em></p>",
    editable: false,
    immediatelyRender: false,
  });

  return <EditorContent editor={editor} className="rounded border p-3 text-sm" />;
}
