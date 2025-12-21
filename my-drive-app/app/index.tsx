import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};

const BACKEND_BASE_URL = "http://192.168.0.104:8000";
const UPLOAD_ENDPOINT = `${BACKEND_BASE_URL}/api/v1/upload-files`;

export default function Index() {
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const canUpload = useMemo(
    () => files.length > 0 && !uploading,
    [files.length, uploading]
  );

  const pickFiles = useCallback(async () => {
    try {
      setStatus(null);
      const result: any = await (DocumentPicker as any).getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result || result.canceled) return;

      const picked: PickedFile[] = (result.assets || [])
        .map((a: any) => ({
          uri: a.uri,
          name: a.name,
          mimeType: a.mimeType ?? null,
          size: a.size ?? null,
        }))
        .filter((a: PickedFile) => !!a.uri && !!a.name);

      setFiles(picked);
    } catch (err: any) {
      console.error("DocumentPicker error", err);
      Alert.alert("Pick Error", err?.message ?? "Failed to pick files.");
    }
  }, []);

  const uploadFiles = useCallback(async () => {
    if (files.length === 0) return;
    try {
      setUploading(true);
      setStatus("Uploading...");

      const formData = new FormData();
      files.forEach((f, idx) => {
        const file = {
          uri: f.uri,
          name: f.name || `file_${idx}`,
          type: f.mimeType || "application/octet-stream",
        } as any;
        formData.append("files", file);
      });

      const res = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        // Let React Native set the multipart boundary automatically
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Upload failed with status ${res.status}`);
      }

      const json = await res.json().catch(() => null);
      setStatus(json?.message || "Upload successful");
      // Optionally clear after success
      // setFiles([]);
    } catch (err: any) {
      console.error("Upload error", err);
      setStatus(null);
      Alert.alert("Upload Error", err?.message ?? "Failed to upload files.");
    } finally {
      setUploading(false);
    }
  }, [files]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View className="flex items-center justify-center bg-white">
        <Text className="text-xl font-bold text-blue-500">
          Welcome to Nativewind!
        </Text>
      </View>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 16 }}>
        My Drive Uploader
      </Text>

      <Pressable
        onPress={pickFiles}
        disabled={uploading}
        style={{
          backgroundColor: "#2563eb",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 8,
          opacity: uploading ? 0.6 : 1,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>
          {uploading ? "Please wait..." : "Select Files"}
        </Text>
      </Pressable>

      <View style={{ width: "90%", maxHeight: 200, marginBottom: 12 }}>
        {files.length > 0 ? (
          <FlatList
            data={files}
            keyExtractor={(item, idx) => `${item.uri}-${idx}`}
            renderItem={({ item }) => (
              <View style={{ paddingVertical: 6 }}>
                <Text style={{ textAlign: "center" }}>{item.name}</Text>
              </View>
            )}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: "#e5e7eb" }} />
            )}
          ></FlatList>
        ) : (
          <Text style={{ color: "#6b7280", textAlign: "center" }}>
            No files selected
          </Text>
        )}
      </View>

      <Pressable
        onPress={uploadFiles}
        disabled={!canUpload}
        style={{
          backgroundColor: canUpload ? "#16a34a" : "#9ca3af",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 8,
          opacity: uploading ? 0.7 : 1,
          marginBottom: 8,
          minWidth: 140,
          alignItems: "center",
        }}
      >
        {uploading ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ActivityIndicator color="#ffffff" />
            <Text style={{ color: "white", fontWeight: "600", marginLeft: 8 }}>
              Uploading...
            </Text>
          </View>
        ) : (
          <Text style={{ color: "white", fontWeight: "600" }}>Upload</Text>
        )}
      </Pressable>

      {status ? (
        <Text style={{ marginTop: 6, color: "#111827" }}>{status}</Text>
      ) : null}

      <View style={{ position: "absolute", bottom: 24 }}>
        <Text style={{ color: "#6b7280", textAlign: "center" }}>
          Endpoint: {UPLOAD_ENDPOINT}
          {Platform.OS !== "web" ? "" : " (web)"}
        </Text>
      </View>
    </View>
  );
}
