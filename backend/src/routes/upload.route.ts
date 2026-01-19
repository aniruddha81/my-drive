import { Router } from "express";
import {
  signUploadForm,
  storeIntoDB,
} from "../controllers/upload.controller.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";

const uploadRouter = Router();

uploadRouter.get("/upload-files", (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Upload API is working"));
});

uploadRouter.post("/sign_upload_form", signUploadForm);
uploadRouter.post("/store_into_db", storeIntoDB);

// uploadRouter.post("/upload-files", upload.array('files', 10), uploadController);

export default uploadRouter;
