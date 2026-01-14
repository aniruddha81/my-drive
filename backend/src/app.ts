import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { CORS_ORIGIN } from "./Constants.js";

const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

// Body parsing middlwares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import Routes
import uploadRouter from "./routes/upload.route.js";

// API Routes
app.use("/api/v1", uploadRouter);

export default app;
