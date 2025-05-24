import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import pool from '../db/dbconnection';

interface DecodedToken {
    id: number;
    iat: number;
    exp: number;
}

interface AuthenticatedRequest extends Request {
    user?: any;
}

const verifyUserJWT = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token = req.cookies?.accessToken;

        if (!token) {
            token = req.header('Authorization')?.replace('Bearer ', '');
        }

        if (!token) {
            res.status(401).json({ message: 'Unauthorized: Missing accessToken' });
            return;
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET as string
        ) as DecodedToken;

        // Fetch user from PostgreSQL using ID
        const userResult = await pool.query(
            'SELECT id, username, email, created_at FROM users WHERE id = $1',
            [decodedToken.id]
        );

        if (userResult.rowCount === 0) {
            res.status(401).json({ message: 'Unauthorized: User not found' });
            return;
        }

        req.user = userResult.rows[0];
        next();
    } catch (error: any) {
        console.error('JWT Verification Error:', error);

        if (error.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Unauthorized: AccessToken expired' });
        } else if (error.name === 'JsonWebTokenError') {
            res.status(401).json({ message: 'Unauthorized: Invalid accessToken' });
        } else {
            res.status(401).json({ message: 'Unauthorized: Authentication error' });
        }
    }
};

export default verifyUserJWT;
