"use client";

import { useId, useState } from "react";

export default function FileInputButton({
  name,
  accept,
  required,
  multiple,
  label,
  onChange,
}: {
  name: string;
  accept?: string;
  required?: boolean;
  multiple?: boolean;
  label: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const id = useId();
  const [fileNames, setFileNames] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-1 text-sm">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <label
          htmlFor={id}
          className="cursor-pointer rounded bg-foreground px-3 py-1.5 text-sm text-white"
        >
          Choose File{multiple ? "s" : ""}
        </label>
        <span className="text-xs text-gray-500">
          {fileNames.length > 0 ? fileNames.join(", ") : "No file chosen"}
        </span>
      </div>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          setFileNames(Array.from(e.target.files ?? []).map((f) => f.name));
          onChange?.(e);
        }}
      />
    </div>
  );
}
