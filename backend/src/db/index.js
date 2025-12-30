import { prisma } from "../../lib/prisma";

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("DB Connected via Prisma");
    } catch (error) {
        console.error(`Database connection error: ${error.message}`);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    await prisma.$disconnect();
};

export { connectDB, disconnectDB };