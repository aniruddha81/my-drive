import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import express from "express";

config({ path: "./.env" });


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// Body parsing middlwares
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


// Import Routes
import uploadRouter from "./routes/upload.route.js";


// API Routes
app.use("/api/v1", uploadRouter);

const server = app.listen(process.env.PORT || 5001, "0.0.0.0", () => {
    console.log(`Server running on PORT ${process.env.PORT}`);
});