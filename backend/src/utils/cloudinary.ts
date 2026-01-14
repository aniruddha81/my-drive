import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { API_KEY, API_SECRET, CLOUD_NAME } from "../Constants.js";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) throw new ApiError(400, "Local file path is required");
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    const ErrorMsg = error instanceof Error ? error.message : String(error);
    console.error("Cloudinary upload error:", ErrorMsg);

    fs.unlinkSync(localFilePath);
    throw error;
  }
};

export { uploadOnCloudinary };
