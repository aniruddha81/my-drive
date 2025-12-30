"use client";

import { Button } from "@/components/ui/button";
import { headers } from "next/dist/server/request/headers";
import { useState } from "react";

export default function SimpleFileUpload() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(e.target.files);
    setMessage("");
  }

  async function handleUpload() {
    if (!files || files.length === 0) {
      setMessage("Please choose one or more files first.");
      return;
    }

    const form = new FormData();
    // IMPORTANT: field name must be "files" (multer expects this)
    Array.from(files).forEach((file) => form.append("files", file));

    try {
      setLoading(true);
      setMessage("");

      // Change the URL/port if your backend runs elsewhere
      const res = await fetch(
        "/api/v1/upload-files",
        {
          method: "POST",
          body: form,
        }
      );

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status}`);
      }

      setMessage("Files uploaded successfully.");
      setFiles(null);
      // Optionally clear the input element by resetting key (kept simple here)
    } catch (err: any) {
      setMessage(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-xl font-semibold">Simple File Upload</h1>

      <input
        type="file"
        multiple
        onChange={handleSelect}
        className="block w-full rounded border p-2"
      />

      <Button
        onClick={handleUpload}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload"}
      </Button>

      {files && files.length > 0 && (
        <div className="text-sm text-gray-600">
          Selected:{" "}
          {Array.from(files)
            .map((f) => f.name)
            .join(", ")}
        </div>
      )}

      {message && <div className="text-sm">{message}</div>}
    </div>
  );
}
