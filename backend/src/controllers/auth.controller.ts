import type { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { asyncHandler } from "../utils/asynchandler.ts";
import { prisma } from "../../lib/prisma.ts";
import { ApiError } from "../utils/ApiError.ts";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken";

const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      throw new ApiError(400, "User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = generateToken(user.id, res);

    res.status(201).json(
      new ApiResponse(
        201,
        {
          user: {
            id: user.id,
            name: name,
            email: email,
          },
          token,
        },
        "User registered successfully",
      ),
    );
  },
);
const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new ApiError(400, "No user found with this email");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(400, "Invalid password");
    }

    const token = generateToken(user.id, res);
    res.status(200).json(
      new ApiResponse(
        201,
        {
          user: {
            id: user.id,
            email,
          },
          token,
        },
        "User logged in successfully",
      ),
    );
  },
);
const logout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(),
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "User logged out successfully"));
  },
);

export { login, logout, register };
