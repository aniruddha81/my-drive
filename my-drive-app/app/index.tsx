import React, { useState } from "react";
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
import api from "@/lib/api";

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

export default function UploadScreen() {
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");

  const pickFiles = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });

    console.log("Picked files:", res);

    if (!res.canceled) {
      setFiles(res.assets);
    }
  };

  const uploadAll = async () => {
    if (!files.length) return;

    setUploading(true);
    setProgress(0);
    setResults([]);
    setError("");

    try {
      // 1) Ask backend to sign uploads
      const fileMeta = files.map((f) => ({ filename: f.name }));

      const signRes = await api.post<SignResponse>("/api/v1/sign_upload_form", {
        folder: "signed_upload_demo_form",
        files: fileMeta,
      });

      const uploads = signRes.data.data;

      if (uploads.length !== files.length) {
        throw new Error("Signature response count mismatch");
      }

      // 2) Upload each file to Cloudinary
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const signed = uploads[i];

        const url = `https://api.cloudinary.com/v1_1/${signed.cloudname}/auto/upload`;

        const formData = new FormData();

        formData.append("file", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        } as any);

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
            setProgress(evt.loaded / evt.total);
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
    <ScrollView className="flex-1 bg-white p-6">
      <Text className="text-2xl font-semibold">
        Signed Upload (Expo + NativeWind)
      </Text>

      <View className="mt-6 space-y-3">
        <Pressable
          onPress={pickFiles}
          disabled={uploading}
          className="rounded-lg bg-gray-900 px-4 py-3"
        >
          <Text className="text-center text-white">Choose files</Text>
        </Pressable>

        <Pressable
          onPress={uploadAll}
          disabled={uploading || !files.length}
          className="rounded-lg bg-blue-600 px-4 py-3 disabled:opacity-50"
        >
          <Text className="text-center text-white">
            {uploading ? "Uploading..." : "Upload"}
          </Text>
        </Pressable>
      </View>

      {uploading && (
        <View className="mt-6">
          <View className="flex-row justify-between">
            <Text className="text-sm">Uploading…</Text>
            <Text className="text-sm">{Math.round(progress * 100)}%</Text>
          </View>
          <View className="mt-2 h-3 w-full overflow-hidden rounded-full border">
            <View
              className="h-full bg-blue-600"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
        </View>
      )}

      {error !== "" && (
        <View className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <Text className="text-sm text-red-700">{error}</Text>
        </View>
      )}

      <View className="mt-6 space-y-4">
        {results.map((r, idx) => (
          <View key={idx} className="rounded-xl border p-4">
            <Text className="text-sm font-medium">
              Uploaded ({r.resource_type}) ✅
            </Text>

            {r.secure_url && r.resource_type === "image" && (
              <Image
                source={{ uri: r.secure_url }}
                className="mt-3 h-72 w-full rounded-xl"
                resizeMode="cover"
              />
            )}

            <Text className="mt-3 rounded bg-gray-50 p-3 text-xs">
              {JSON.stringify(r, null, 2)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
