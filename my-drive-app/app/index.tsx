import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};

const BACKEND_BASE_URL = "http://localhost:8000";
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
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Upload failed with status ${res.status}`);
      }

      const json = await res.json().catch(() => null);
      setStatus(json?.message || "Upload successful");
    } catch (err: any) {
      console.error("Upload error", err);
      setStatus(null);
      Alert.alert("Upload Error", err?.message ?? "Failed to upload files.");
    } finally {
      setUploading(false);
    }
  }, [files]);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View className="flex-1 bg-linear-to-b from-blue-50 to-white">
      <ScrollView
        contentContainerClassName="flex-grow justify-center items-center px-6 py-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="mb-8 items-center">
          <View className="bg-blue-600 w-16 h-16 rounded-full items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">📁</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            My Drive
          </Text>
          <Text className="text-base text-gray-500 text-center">
            Upload and manage your files easily
          </Text>
        </View>

        {/* File Selection Card */}
        <View className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 mb-6">
          <Text className="text-lg font-semibold text-gray-700 mb-4">
            Select Files
          </Text>

          <Pressable
            onPress={pickFiles}
            disabled={uploading}
            className={`${
              uploading ? "bg-blue-400" : "bg-blue-600 active:bg-blue-700"
            } px-6 py-4 rounded-xl mb-4 shadow-md`}
          >
            <Text className="text-white font-semibold text-center text-base">
              {uploading ? "Please wait..." : "📎 Choose Files"}
            </Text>
          </Pressable>

          {/* Files List */}
          <View className="max-h-64 mb-4">
            {files.length > 0 ? (
              <View className="bg-gray-50 rounded-xl p-3">
                <Text className="text-sm font-medium text-gray-600 mb-2">
                  Selected Files ({files.length})
                </Text>
                <FlatList
                  data={files}
                  keyExtractor={(item, idx) => `${item.uri}-${idx}`}
                  renderItem={({ item }) => (
                    <View className="bg-white rounded-lg p-3 mb-2 border border-gray-200">
                      <Text
                        className="text-gray-800 font-medium text-sm mb-1"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      {item.size && (
                        <Text className="text-gray-500 text-xs">
                          {formatFileSize(item.size)}
                        </Text>
                      )}
                    </View>
                  )}
                  nestedScrollEnabled
                />
              </View>
            ) : (
              <View className="bg-gray-50 rounded-xl p-8 items-center justify-center">
                <Text className="text-4xl mb-2">📂</Text>
                <Text className="text-gray-400 text-center text-sm">
                  No files selected yet
                </Text>
              </View>
            )}
          </View>

          {/* Upload Button */}
          <Pressable
            onPress={uploadFiles}
            disabled={!canUpload}
            className={`${
              canUpload ? "bg-green-600 active:bg-green-700" : "bg-gray-400"
            } px-6 py-4 rounded-xl shadow-md ${uploading ? "opacity-70" : ""}`}
          >
            {uploading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="#ffffff" size="small" />
                <Text className="text-white font-semibold ml-3 text-base">
                  Uploading...
                </Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-center text-base">
                ⬆️ Upload Files
              </Text>
            )}
          </Pressable>

          {/* Status Message */}
          {status && (
            <View className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <Text className="text-green-800 text-center text-sm font-medium">
                ✓ {status}
              </Text>
            </View>
          )}
        </View>

        {/* Footer Info */}
        <View className="items-center mt-4">
          <Text className="text-gray-400 text-xs text-center">
            Endpoint: {UPLOAD_ENDPOINT}
          </Text>
          <Text className="text-gray-400 text-xs text-center mt-1">
            Platform: {Platform.OS}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
