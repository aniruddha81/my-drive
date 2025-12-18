import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const upload = asyncHandler(async (req, res) => {
    const files = req.files;

    try {
        files.forEach(async elem => {

            const file = await uploadOnCloudinary(elem.path);
            console.log("Uploaded file info:", file);
        })
    } catch (error) {
        throw new ApiError(500, "Failed to upload files to cloud");
    }

    return res.status(200).json(new ApiResponse(200, null, "Files uploaded successfully"));
});

export { upload };

