import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const upload = asyncHandler(async (req, res) => {
    const files = req.files;

    if (!files || files.length === 0) {
        throw new ApiError(400, "No files provided");
    }

    const uploadedFiles = [];

    try {
        // Upload sequentially to avoid race conditions
        for (const file of files) {
            console.log("Uploading file:", file.originalname);

            const cloudinaryFile = await uploadOnCloudinary(file.path);
            console.log("Uploaded file info:", cloudinaryFile);

            const storeFileInDB = await prisma.file.create({
                data: {
                    name: cloudinaryFile.original_filename,
                    publicId: cloudinaryFile.public_id,
                    url: cloudinaryFile.secure_url,
                    size: cloudinaryFile.bytes,
                    format: cloudinaryFile.format,
                    resourceType: cloudinaryFile.resource_type,
                    width: cloudinaryFile.width || null,
                    height: cloudinaryFile.height || null,
                }
            });

            if (!storeFileInDB) {
                throw new ApiError(500, "Failed to store file info in database");
            }

            uploadedFiles.push(storeFileInDB);
        }

        return res.status(200).json(
            new ApiResponse(200, uploadedFiles, "Files uploaded successfully")
        );

    } catch (error) {
        console.error("Upload error:", error);
        throw new ApiError(500, error.message || "Failed to upload files to cloud");
    }
});

export { upload };