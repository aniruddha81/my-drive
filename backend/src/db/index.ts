import { prisma } from "../../lib/prisma.ts";

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("DB Connected via Prisma");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Database connection error: ${errorMessage}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
};

export { connectDB, disconnectDB };
