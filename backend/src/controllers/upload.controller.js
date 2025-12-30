import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const upload = asyncHandler(async (req, res) => {
    const files = req.files;

    try {
        files.forEach(async elem => {

            const cloudinaryFile = await uploadOnCloudinary(elem.path);
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
            })
        })
    } catch (error) {
        throw new ApiError(500, "Failed to upload files to cloud");
    }

    return res.status(200).json(new ApiResponse(200, null, "Files uploaded successfully"));
});

export { upload };

