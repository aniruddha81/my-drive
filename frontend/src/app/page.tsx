"use client";

import { FileUpload } from "@/components/FileUpload";

export default function SimpleFileUpload() {
  return <FileUpload uploadUrl="/api/v1/upload-files" />;
}
