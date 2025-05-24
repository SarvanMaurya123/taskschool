import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import pool from "../db/dbconnection";

// Zod validation schema
const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

// JWT generator
const generateToken = (id: number): string => {
    return jwt.sign(
        { id },
        process.env.ACCESS_TOKEN_SECRET as string,
        {
            algorithm: "HS256",
            expiresIn: "10h",
            issuer: "Job Portal",
            audience: id.toString(),
        }
    );
};

// Login Controller
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate input
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: "Validation Error", errors: parsed.error.errors });
            return;
        }

        const { email, password } = parsed.data;

        // Find user in PostgreSQL
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        const user = result.rows[0];
        if (!user) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        // Create token
        const token = generateToken(user.id);

        // Send token
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 10 * 60 * 60 * 1000, // 10 hours
        });

        res.status(200).json({
            message: "Login successful",
            token,
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
