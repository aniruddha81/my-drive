import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";
import fs from "fs";
config({ path: "./.env" });


const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("Cloudinary Config Check:");
console.log("Cloud Name:", cloudName ? "Set" : "Missing");
console.log("API Key:", apiKey ? "Set" : "Missing");
console.log("API Secret:", apiSecret ? "Set" : "Missing");

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            upload_preset: "random_files",
        })
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        console.error("Cloudinary upload error:", error.message || error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        }
        throw error; // Re-throw to let controller handle it
    }
}


export { uploadOnCloudinary };

