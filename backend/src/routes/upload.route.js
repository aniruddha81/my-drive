import { Router } from "express";
import { upload as uploadController } from "../controllers/upload.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const uploadRouter = Router();

uploadRouter.get("/upload-files", (req, res) => {
    return res.status(200).json(new ApiResponse(200, null, "Upload API is working"));
});

uploadRouter.post("/upload-files", upload.array("files", 10), uploadController);


export default uploadRouter;