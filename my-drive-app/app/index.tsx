import api from "@/lib/api";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function Index() {
  const [files, setFiles] = useState<any[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSelect() {
    try {
      setMessage("");
      const result: any = await (DocumentPicker as any).getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result || result.canceled) return;

      const picked = (result.assets || []).filter((a: any) => a.uri && a.name);
      setFiles(picked);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to pick files.");
    }
  }

  async function handleUpload() {
    if (!files || files.length === 0) {
      setMessage("Please choose one or more files first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const form = new FormData();
      files.forEach((f: any) => {
        form.append("files", {
          uri: f.uri,
          name: f.name || "file",
          type: f.mimeType || "application/octet-stream",
        } as any);
      });

      // const res = await fetch(UPLOAD_ENDPOINT, {
      //   method: "POST",
      //   body: form,
      // });

      const res = api.post("/api/v1/upload-files", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      res
        .then((response) => {
          setMessage("Files uploaded successfully.");
          setFiles([]);
        })
        .catch((error) => {
          setMessage(`Upload failed: ${error.message}`);
        });

    } catch (err: any) {
      setMessage(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-8 space-y-4">
        <Text className="text-2xl font-bold text-gray-800">File Upload</Text>

        <Pressable
          onPress={handleSelect}
          disabled={loading}
          className={`${
            loading ? "bg-blue-400" : "bg-blue-600"
          } px-4 py-3 rounded`}
        >
          <Text className="text-white font-semibold text-center">
            📎 Choose Files
          </Text>
        </Pressable>

        {files.length > 0 && (
          <View className="bg-gray-100 p-3 rounded">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Selected: {files.length}
            </Text>
            {files.map((f: any, idx: number) => (
              <Text key={idx} className="text-sm text-gray-600">
                • {f.name}
              </Text>
            ))}
          </View>
        )}

        <Pressable
          onPress={handleUpload}
          disabled={!files.length || loading}
          className={`${
            files.length && !loading ? "bg-green-600" : "bg-gray-400"
          } px-4 py-3 rounded`}
        >
          {loading ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-semibold ml-2">
                Uploading...
              </Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-center">Upload</Text>
          )}
        </Pressable>

        {message && (
          <View className="bg-gray-100 p-3 rounded">
            <Text className="text-sm text-gray-800">{message}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
