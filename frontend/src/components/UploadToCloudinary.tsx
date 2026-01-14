"use client";

import axios from "axios";
import React, { useRef, useState } from "react";

type SignedItem = {
  filename: string;
  cloudname: string;
  apikey: string;
  timestamp: number;
  signature: string;
  eager: string;
  folder: string;
  public_id: string;
};

type SignResponse = { data: SignedItem[] };

export default function Page() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  const uploadAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files?.length) return;

    setUploading(true);
    setProgress(0);
    setResults([]);
    setError("");

    try {
      // 1) ask Express to sign each file (unique public_id per file)
      const fileMeta = Array.from(files).map((f) => ({ filename: f.name }));

      const signRes = await axios.post<SignResponse>(
        "api/v1/sign_upload_form",
        {
          folder: "signed_upload_demo_form",
          files: fileMeta,
        }
      );

      const uploads = signRes.data.data;
      console.log("Received signed upload data:", uploads);
      if (uploads.length !== files.length) {
        throw new Error("Signature response count mismatch.");
      }

      // 2) upload each file directly to Cloudinary using its signed bundle
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const signed = uploads[i];

        const url = `https://api.cloudinary.com/v1_1/${signed.cloudname}/auto/upload`;

        const formData = new FormData();
        formData.append("file", file);

        // signed/auth fields
        formData.append("api_key", signed.apikey);
        formData.append("timestamp", String(signed.timestamp));
        formData.append("signature", signed.signature);

        formData.append("eager", signed.eager);
        formData.append("folder", signed.folder);
        formData.append("public_id", signed.public_id);

        const res = await axios.post(url, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (evt) => {
            if (!evt.total) return;
            setProgress(evt.loaded / evt.total); // per-file progress
          },
        });

        setResults((prev) => [...prev, res.data]);
      }
    } catch (e: any) {
      console.log("Upload error:", e);
      setError(
        axios.isAxiosError(e) ? e.response?.data?.error || e.message : String(e)
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">
        Signed Upload (unique public_id per file)
      </h1>

      <form onSubmit={uploadAll} className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
            disabled={uploading}
          >
            Choose files
          </button>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={uploading || !files?.length}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => setFiles(e.target.files)}
          />
        </div>

        {uploading && (
          <div>
            <div className="flex justify-between text-sm">
              <span>Uploading…</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full border">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {results.map((r, idx) => (
          <div key={idx} className="rounded-xl border p-4">
            <div className="text-sm font-medium">
              Uploaded ({r.resource_type}) ✅
            </div>

            {r.secure_url && r.resource_type === "image" && (
              <img
                src={r.secure_url}
                alt="uploaded"
                className="mt-3 h-72 w-full rounded-xl border object-cover"
              />
            )}

            <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs">
              {JSON.stringify(r, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}
