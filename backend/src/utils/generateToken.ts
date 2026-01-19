import jwt from "jsonwebtoken";
import type { Response } from "express";
import type { SignOptions } from "jsonwebtoken";

export const generateToken = (userId: string, res: Response) => {
  const payload = { id: userId };
  const secret = process.env.JWT_SECRET ?? "your-default-secret";

  const expiresIn: SignOptions["expiresIn"] =
    (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) ?? "7d";

  const token = jwt.sign(payload, secret, { expiresIn });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return token;
};
