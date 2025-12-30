import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";
import fs from "fs";
config({ path: "./.env" });


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
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

