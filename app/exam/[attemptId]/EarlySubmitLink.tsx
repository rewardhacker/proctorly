"use client";

export default function EarlySubmitLink({ attemptId }: { attemptId: string }) {
  return (
    <a
      href={`/exam/${attemptId}?step=upload`}
      onClick={(e) => {
        if (!confirm("Submit early? You can optionally upload your workings on the next screen.")) {
          e.preventDefault();
        }
      }}
      className="rounded bg-foreground px-4 py-2 text-white"
    >
      Submit
    </a>
  );
}
