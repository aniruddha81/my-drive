import { uploadOnCloudinary } from "../utils/cloudinary.js";

const upload = async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files received" });
        }

        console.log(`Uploading ${files.length} file(s) to Cloudinary...`);

        // Upload each temp file to Cloudinary
        const uploadResults = await Promise.allSettled(
            files.map((file) => uploadOnCloudinary(file.path))
        );

        const urls = uploadResults
            .filter((result) => result.status === "fulfilled" && result.value)
            .map((result) => result.value.secure_url || result.value.url)
            .filter(Boolean);

        const failedUploads = uploadResults.filter((result) => result.status === "rejected");
        if (failedUploads.length > 0) {
            console.error("Failed uploads:", failedUploads.map((f) => f.reason.message));
        }

        if (urls.length === 0) {
            const errorMsg = failedUploads.length > 0
                ? failedUploads[0].reason.message
                : "All uploads failed";
            return res.status(500).json({ message: errorMsg });
        }

        const partialFailures = uploadResults.length - urls.length;

        return res.status(partialFailures ? 207 : 200).json({
            urls,
            failed: partialFailures,
        });
    } catch (error) {
        console.error("Upload error", error.message || error);
        return res.status(500).json({ message: error.message || "Error uploading files" });
    }
};

export { upload };

