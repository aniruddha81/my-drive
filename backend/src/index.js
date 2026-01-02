import "dotenv/config"
import app from './app.js'
import { connectDB, disconnectDB } from './db/index.js'
import { PORT } from './Constants.js'

// Keep a reference to the server so shutdown handlers can close it.
let server = null

// Centralized graceful shutdown helper
const gracefulShutdown = async (reason = 'shutdown', exitCode = 0) => {
    try {
        console.info(`${reason} - starting graceful shutdown`)

        if (server && typeof server.close === 'function') {
            await new Promise((resolve) => {
                // Close the http server; the callback runs when all connections closed
                server.close(async (err) => {
                    if (err) console.error('Error closing server:', err)
                    try {
                        await disconnectDB()
                    } catch (dbErr) {
                        console.error('Error disconnecting DB:', dbErr)
                    }
                    resolve()
                })

                // Force exit if graceful shutdown takes too long
                setTimeout(() => {
                    console.warn('Forcing shutdown after timeout')
                    resolve()
                }, 10_000)
            })
        } else {
            await disconnectDB()
        }
    } catch (err) {
        console.error('Error during graceful shutdown:', err)
    } finally {
        process.exit(exitCode)
    }
}

// Handle synchronous exceptions as early as possible
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
    // Log the error but keep the server running
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
    // Log the error but keep the server running
})

// Termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 0))
process.on('SIGINT', () => gracefulShutdown('SIGINT', 0))

// Start the application: connect DB then listen
const start = async () => {
    try {
        await connectDB()

        const port = Number(PORT) || 8000
        const host = process.env.HOST || '0.0.0.0'

        server = app.listen(port, host, () => {
            console.info(`Server running on http://${host}:${port}`)
        })
    } catch (err) {
        console.error('Failed to start application:', err)
        try {
            await disconnectDB()
        } catch (e) {
            console.error('Error while disconnecting DB after failed start:', e)
        }
        process.exit(1)
    }
}

start()