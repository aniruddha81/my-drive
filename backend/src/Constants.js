import "dotenv/config"

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const PORT = process.env.PORT;
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const DATABASE_URL = process.env.DATABASE_URL;

export { API_KEY, API_SECRET, CLOUD_NAME, CORS_ORIGIN, PORT, DATABASE_URL };