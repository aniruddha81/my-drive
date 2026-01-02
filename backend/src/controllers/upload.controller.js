import { prisma } from "../../lib/prisma.ts";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadController = asyncHandler(async (req, res) => {
    const files = req.files;

    if (!files || files.length === 0) {
        throw new ApiError(400, "No files provided");
    }


    try {
        const filePaths = files.map(file => file.path);

        const cloudinaryFiles = await Promise.all(filePaths.map(uploadOnCloudinary));

        const dbFiles = cloudinaryFiles.map(file => ({
            name: file.original_filename,
            publicId: file.public_id,
            url: file.secure_url,
            size: file.bytes,
            format: file.format,
            resourceType: file.resource_type,
            width: file.width || null,
            height: file.height || null,
        }));
        const storedFiles = await prisma.file.createManyAndReturn({
            data: dbFiles,
        });

        if (!storedFiles || storedFiles.length === 0) {
            throw new ApiError(500, "Failed to store file info in database");
        }

        return res.status(200).json(
            new ApiResponse(200, storedFiles, "Files uploaded successfully")
        );

    } catch (error) {
        console.error("Upload error:", error);
        throw new ApiError(500, error.message || "Failed to upload files to cloud");
    }
});

export default uploadController;