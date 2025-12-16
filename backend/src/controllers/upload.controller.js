import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const upload = asyncHandler(async (req, res) => {
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files received" });
    }

    console.log(`Uploading ${files.length} file(s) to Cloudinary...`);

    const uploadedUrls = [];
    let failed = 0;

    // Upload files one by one so it is easy to follow
    for (const file of files) {
        try {
            const result = await uploadOnCloudinary(file.path);
            const url = result?.secure_url || result?.url;
            if (url) {
                uploadedUrls.push(url);
            } else {
                failed += 1;
            }
        } catch (error) {
            console.error("File failed to upload:", error?.message || error);
            failed += 1;
        }
    }

    if (uploadedUrls.length === 0) {
        throw new ApiError(500, "File upload failed");
    }

    return res.status(failed ? 207 : 200).json({
        urls: uploadedUrls,
        failed,
    });
});

export { upload };

