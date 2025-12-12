"use client";

import { useState } from "react";
import useSWR from "swr";

const fetcher = async (url: string, formData: FormData) => {
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Upload failed");
  }

  return response.json();
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [formData, setFormData] = useState<FormData | null>(null);

  const {
    data,
    isLoading,
    error: swrError,
    mutate,
  } = useSWR(
    formData ? ["/api/upload", formData] : null,
    ([url, data]) => fetcher(url, data),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const newFormData = new FormData();
      files.forEach((file) => {
        newFormData.append("files", file);
      });

      setFormData(newFormData);
      const result = await mutate();

      if (result) {
        setUploadedFiles(result.urls || []);
        setSuccess(`Successfully uploaded ${files.length} file(s)`);
        setFiles([]);
        // Reset file input
        const fileInput = document.getElementById(
          "fileInput"
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during upload"
      );
    } finally {
      setFormData(null);
    }
  };

  return (
    <div className="min-h-screen from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          File Upload
        </h1>

        <div className="bg-slate-700 rounded-lg shadow-lg p-8">
          {/* File Input */}
          <div className="mb-6">
            <label
              htmlFor="fileInput"
              className="block text-white font-semibold mb-3"
            >
              Select Files (Audio, Video, Text, or Any File Type)
            </label>
            <input
              id="fileInput"
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-slate-300 border border-slate-500 rounded-lg p-3 bg-slate-600 cursor-pointer hover:bg-slate-500 transition"
            />
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="mb-6 bg-slate-600 rounded-lg p-4">
              <h2 className="text-white font-semibold mb-3">
                Selected Files ({files.length})
              </h2>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li
                    key={index}
                    className="text-slate-200 flex justify-between items-center"
                  >
                    <span>
                      {file.name} - {(file.size / 1024).toFixed(2)} KB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-600 text-white rounded-lg p-4">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 bg-green-600 text-white rounded-lg p-4">
              {success}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isLoading || files.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition mb-6"
          >
            {isLoading ? "Uploading..." : "Upload to Cloudinary"}
          </button>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="bg-slate-600 rounded-lg p-4">
              <h2 className="text-white font-semibold mb-3">Uploaded Files</h2>
              <ul className="space-y-2">
                {uploadedFiles.map((url, index) => (
                  <li key={index} className="text-slate-200">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 break-all"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
