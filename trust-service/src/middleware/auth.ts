import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        role: 'SUPER_ADMIN' | 'USER';
    };
}

/**
 * JWT Authentication Middleware
 * Validates JWT token from Authorization header
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'No token provided',
        });
        return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        (req as AuthenticatedRequest).user = {
            userId: decoded.userId,
            role: decoded.role,
        };
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Token has expired',
            });
            return;
        }
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token',
        });
    }
};

export default authenticateJWT;
