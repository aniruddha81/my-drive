import api from "@/lib/api";
import { Feather } from "@expo/vector-icons";
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
      setFiles((prev) => [...prev, ...picked]);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to pick files.");
    }
  }

  function handleRemove(uri: string) {
    setFiles((prev) => prev.filter((f) => f.uri !== uri));
  }

  function handleClear() {
    setFiles([]);
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

      const res = api.post("/api/v1/upload-files", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      res
        .then((response) => {
          setMessage("Files uploaded successfully.");
          setFiles([]);
          Alert.alert("Success", "Files uploaded successfully.");
        })
        .catch((error) => {
          setMessage(`Upload failed: ${error.message}`);
          Alert.alert("Upload Failed", error.message);
        });
    } catch (err: any) {
      setMessage(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 py-12 space-y-8">
        {/* Header Section */}
        <View className="border-b border-border pb-6">
          <Text className="text-4xl font-light text-foreground tracking-tight">
            File <Text className="font-bold text-primary">Upload</Text>
          </Text>
          <Text className="text-muted-foreground mt-2 text-lg">
            Securely upload and manage your documents.
          </Text>
        </View>

        {/* Main Card */}
        <View className="bg-card rounded-3xl p-6 shadow-sm border border-border space-y-6">
          {/* Action Buttons */}
          <View className="flex-col gap-4">
            <Pressable
              onPress={handleSelect}
              disabled={loading}
              className={`flex-row items-center justify-center space-x-3 px-6 py-4 rounded-xl border-2 border-dashed border-primary/30 active:bg-primary/5 ${loading ? "opacity-50" : ""}`}
            >
              <View className="bg-primary/10 p-3 rounded-full">
                <Feather
                  name="plus"
                  size={24}
                  className="text-primary"
                  color="#ea9e20"
                />
                {/* Note: In nativewind v4 we might need to pass color prop explicitly for icons if class doesn't apply immediately or stick to style prop. Using hex for gold/primary mainly for reliability in icons */}
              </View>
              <Text className="text-primary font-semibold text-lg">
                Add Files
              </Text>
            </Pressable>
          </View>

          {/* Selected Files List */}
          {files.length > 0 && (
            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-foreground">
                  Selected ({files.length})
                </Text>
                <Pressable onPress={handleClear}>
                  <Text className="text-destructive font-medium">
                    Clear All
                  </Text>
                </Pressable>
              </View>

              <View className="bg-background/50 rounded-xl overflow-hidden border border-border/50">
                {files.map((f: any, idx: number) => (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between p-4 border-b border-border/50 last:border-0"
                  >
                    <View className="flex-row items-center space-x-4 flex-1">
                      <View className="bg-muted p-2 rounded-lg">
                        <Feather
                          name="file-text"
                          size={20}
                          className="text-foreground"
                          color="#334155"
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-foreground font-medium"
                          numberOfLines={1}
                        >
                          {f.name}
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                          {f.size
                            ? (f.size / 1024).toFixed(1) + " KB"
                            : "Unknown size"}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleRemove(f.uri)}
                      className="p-2"
                    >
                      <Feather
                        name="x"
                        size={18}
                        className="text-muted-foreground"
                        color="#94a3b8"
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Upload Button */}
          <Pressable
            onPress={handleUpload}
            disabled={!files.length || loading}
            className={`${
              files.length && !loading
                ? "bg-primary shadow-lg shadow-primary/30"
                : "bg-muted"
            } px-6 py-5 rounded-2xl flex-row items-center justify-center space-x-3 transition-all will-change-variable`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather
                  name="upload-cloud"
                  size={24}
                  color={files.length ? "#fff" : "#94a3b8"}
                />
                <Text
                  className={`${files.length ? "text-primary-foreground" : "text-muted-foreground"} font-bold text-lg`}
                >
                  {loading ? "Uploading..." : "Upload Now"}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Message Toast/Area */}
        {message ? (
          <View className="bg-popover p-4 rounded-xl border border-border shadow-sm">
            <Text className="text-popover-foreground text-center font-medium">
              {message}
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
