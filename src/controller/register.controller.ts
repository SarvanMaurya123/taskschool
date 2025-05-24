import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import pool from "../db/dbconnection";

// Validation Schema
const userSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const registerUser = async (
    req: Request,
    res: Response,
    _next: NextFunction
): Promise<void> => {
    try {
        const validatedData = userSchema.parse(req.body);
        const { username, email, password } = validatedData;

        // Check if user already exists
        const userCheck = await pool.query(
            "SELECT id FROM users WHERE email = $1 OR username = $2",
            [email, username]
        );

        if ((userCheck.rowCount ?? 0) > 0) {
            res.status(400).json({ message: "User already exists" });
            return;
        }


        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const result = await pool.query(
            `INSERT INTO users (username, email, password) VALUES ($1, $2, $3)
     RETURNING id, username, email`,
            [username, email, hashedPassword]
        );


        const newUser = result.rows[0];

        res.status(201).json({
            message: "User registered successfully.",
            user: newUser,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: "Validation failed", errors: error.errors });
        } else {
            console.error("Registration Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
};
