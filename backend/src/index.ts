import "dotenv/config";
import { Server } from "http";
import app from "./app.js";
import { PORT } from "./Constants.js";
import { connectDB, disconnectDB } from "./db/index.js";

// Keep a reference to the server so shutdown handlers can close it.
let server: Server | null = null;

// Centralized graceful shutdown helper
const gracefulShutdown = async (
  reason: string = "shutdown",
  exitCode: number = 0
): Promise<void> => {
  try {
    console.info(`${reason} - starting graceful shutdown`);

    if (server && typeof server.close === "function") {
      await new Promise<void>((resolve) => {
        // Close the http server; the callback runs when all connections closed
        server!.close(async (err?: Error) => {
          if (err) console.error("Error closing server:", err);
          try {
            await disconnectDB();
          } catch (dbErr: unknown) {
            const errorMsg =
              dbErr instanceof Error ? dbErr.message : String(dbErr);
            console.error("Error disconnecting DB:", errorMsg);
          }
          resolve();
        });

        // Force exit if graceful shutdown takes too long
        setTimeout(() => {
          console.warn("Forcing shutdown after timeout");
          resolve();
        }, 10_000);
      });
    } else {
      await disconnectDB();
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error during graceful shutdown:", errorMsg);
  } finally {
    process.exit(exitCode);
  }
};

// Handle synchronous exceptions as early as possible
process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception:", err.message);
  // Log the error but keep the server running
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: unknown, promise: Promise<any>) => {
  const reasonMsg = reason instanceof Error ? reason.message : String(reason);
  console.error("Unhandled Rejection at:", promise, "reason:", reasonMsg);
  // Log the error but keep the server running
});

// Termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM", 0));
process.on("SIGINT", () => gracefulShutdown("SIGINT", 0));

// Start the application: connect DB then listen
const start = async (): Promise<void> => {
  try {
    await connectDB();

    const port = Number(PORT) || 8000;
    const host = process.env.HOST || "0.0.0.0";

    server = app.listen(port, host, () => {
      console.info(`Server running on http://${host}:${port}`);
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Failed to start application:", errorMsg);
    try {
      await disconnectDB();
    } catch (e: unknown) {
      const dbErrorMsg = e instanceof Error ? e.message : String(e);
      console.error(
        "Error while disconnecting DB after failed start:",
        dbErrorMsg
      );
    }
    process.exit(1);
  }
};

start();
