import { Router } from "express";
import { upload as uploadController } from "../controllers/upload.controller.js";
import { upload as uploadMiddleware } from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/", (req, res) => {
    res.send("Upload route is working");
});

router.post("/", uploadMiddleware.array("files"), uploadController);


export default router;