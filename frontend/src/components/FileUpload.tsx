import axios from "axios";
import {
  FileAudio,
  FileIcon,
  FileImage,
  FileText,
  FileVideo,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

type FileWithProgress = {
  id: string;
  file: File;
  progress: number;
  uploaded: boolean;
};

export function FileUpload({ uploadUrl }: { uploadUrl: string }) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) {
      return;
    }

    const newFiles = Array.from(e.target.files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      uploaded: false,
    }));

    setFiles([...files, ...newFiles]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (files.length === 0 || uploading) {
      return;
    }

    setUploading(true);

    const formData = new FormData();

    // Append all files to the same FormData
    files.forEach((fileWithProgress) => {
      formData.append("files", fileWithProgress.file);
    });

    try {
      await axios.post(uploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          // Update progress for all files
          setFiles((prevFiles) =>
            prevFiles.map((file) => ({ ...file, progress }))
          );
        },
      });

      // Mark all files as uploaded
      setFiles((prevFiles) =>
        prevFiles.map((file) => ({ ...file, uploaded: true }))
      );
    } catch (error) {
      console.error(error);
    }

    setUploading(false);
  }

  function removeFile(id: string) {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  }

  function handleClear() {
    setFiles([]);
  }

  console.log("files : ", files);
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card border border-border shadow-2xl rounded-2xl p-8 backdrop-blur-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-light tracking-wide text-foreground">
              File <span className="font-semibold text-primary">Upload</span>
            </h2>
            <div className="h-px w-24 bg-linear-to-r from-transparent via-primary/50 to-transparent" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <FileInput
              inputRef={inputRef}
              disabled={uploading}
              onFileSelect={handleFileSelect}
            />
            <div className="flex gap-2 flex-1 sm:justify-end">
              <ActionButtons
                disabled={files.length === 0 || uploading}
                onUpload={handleUpload}
                onClear={handleClear}
              />
            </div>
          </div>

          <div className="mt-2">
            <FileList
              files={files}
              onRemove={removeFile}
              uploading={uploading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type FileInputProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
};

function FileInput({ inputRef, disabled, onFileSelect }: FileInputProps) {
  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={onFileSelect}
        multiple
        className="hidden"
        id="file-upload"
        disabled={disabled}
      />
      <label
        htmlFor="file-upload"
        className={`
            flex cursor-pointer items-center justify-center gap-2 rounded-lg 
            bg-secondary px-6 py-3 font-medium text-secondary-foreground 
            transition-all hover:bg-secondary/90 hover:shadow-lg hover:-translate-y-0.5
            active:translate-y-0
            ${disabled ? "cursor-not-allowed opacity-50" : ""}
        `}
      >
        <Plus size={18} />
        <span className="tracking-wide">Select Files</span>
      </label>
    </>
  );
}

type ActionButtonsProps = {
  disabled: boolean;
  onUpload: () => void;
  onClear: () => void;
};

function ActionButtons({ onUpload, onClear, disabled }: ActionButtonsProps) {
  return (
    <>
      <button
        onClick={onUpload}
        disabled={disabled}
        className={`
            flex items-center justify-center gap-2 rounded-lg 
            bg-primary px-6 py-3 font-medium text-primary-foreground 
            transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5
            disabled:cursor-not-allowed disabled:opacity-50
            active:translate-y-0 shadow-md
        `}
      >
        <Upload size={18} />
        <span className="tracking-wide">Upload</span>
      </button>
      <button
        onClick={onClear}
        className={`
            flex items-center justify-center gap-2 rounded-lg 
            border border-border bg-background px-4 py-3 font-medium text-muted-foreground 
            transition-all hover:bg-muted hover:text-foreground
            disabled:cursor-not-allowed disabled:opacity-50
        `}
        disabled={disabled}
      >
        <Trash2 size={18} />
      </button>
    </>
  );
}

type FileListProps = {
  files: FileWithProgress[];
  onRemove: (id: string) => void;
  uploading: boolean;
};

function FileList({ files, onRemove, uploading }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground">
        <p className="text-sm">No files selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <h3 className="font-medium">Files ({files.length})</h3>
      </div>
      <div className="space-y-3 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            onRemove={onRemove}
            uploading={uploading}
          />
        ))}
      </div>
    </div>
  );
}

type FileItemProps = {
  file: FileWithProgress;
  onRemove: (id: string) => void;
  uploading: boolean;
};

function FileItem({ file, onRemove, uploading }: FileItemProps) {
  const Icon = getFileIcon(file.file.type);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-background p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary">
            <Icon size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground line-clamp-1">
              {file.file.name}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatFileSize(file.file.size)}</span>
              <span className="bg-muted-foreground/20 w-1 h-1 rounded-full"></span>
              <span>{file.file.type || "Unknown"}</span>
            </div>
          </div>
        </div>
        {!uploading && (
          <button
            onClick={() => onRemove(file.id)}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span
          className={
            file.uploaded ? "text-primary font-medium" : "text-muted-foreground"
          }
        >
          {file.uploaded
            ? "Upload Complete"
            : uploading
            ? "Uploading..."
            : "Ready"}
        </span>
        <span className="text-muted-foreground">
          {Math.round(file.progress)}%
        </span>
      </div>

      <div className="mt-2">
        <ProgressBar progress={file.progress} isUploaded={file.uploaded} />
      </div>
    </div>
  );
}

type ProgressBarProps = {
  progress: number;
  isUploaded?: boolean;
};

function ProgressBar({ progress, isUploaded }: ProgressBarProps) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full transition-all duration-500 ease-out ${
          isUploaded ? "bg-green-500" : "bg-primary"
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType === "application/pdf") return FileText;
  return FileIcon;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
