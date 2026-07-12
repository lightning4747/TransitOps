import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import { LoginInput } from "./auth.schema";
import { AppError } from "../../middleware/errorHandler";

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const login = async (input: LoginInput): Promise<LoginResponse> => {
  const { email, password } = input;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  // Validate password
  // Seed file uses SHA-256 for determinism, production code uses bcrypt.
  // We support both to ensure seamless integration with seeded data.
  const isBcrypt = user.passwordHash.startsWith("$2") || user.passwordHash.length !== 64;
  let isPasswordValid = false;

  if (isBcrypt) {
    isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  } else {
    const sha256Hash = crypto.createHash("sha256").update(password).digest("hex");
    isPasswordValid = sha256Hash === user.passwordHash;

    // Optional: Upgrade the password hash to bcrypt if the password is valid
    if (isPasswordValid) {
      try {
        const bcryptHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: bcryptHash },
        });
      } catch (err) {
        console.error("Failed to upgrade password hash to bcrypt:", err);
      }
    }
  }

  if (!isPasswordValid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  // Generate JWT
  const secret = process.env.JWT_SECRET || "your_super_secret_hackathon_key_here";
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    secret,
    { expiresIn: "24h" }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};
