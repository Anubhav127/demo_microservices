import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * JWT payload interface
 */
export interface JWTPayload {
    userId: string;
    role: 'SUPER_ADMIN' | 'USER';
    iat?: number;
    exp?: number;
}

/**
 * Extended Request interface with user payload
 */
export interface AuthenticatedRequest extends Request {
    user: JWTPayload;
}

/**
 * JWT secret from environment
 */
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

/**
 * authenticateJWT middleware
 * Validates JWT from Authorization header and attaches user to request
 */
export const authenticateJWT = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing authentication token',
        });
        return;
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid authorization header format',
        });
        return;
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Attach user payload to request
        (req as AuthenticatedRequest).user = {
            userId: decoded.userId,
            role: decoded.role,
            iat: decoded.iat,
            exp: decoded.exp,
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
            message: 'Invalid or expired token',
        });
    }
};

/**
 * requireRole middleware factory
 * Checks if user has one of the allowed roles
 * @param allowedRoles - Array of roles that can access the route
 */
export const requireRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as AuthenticatedRequest).user;

        if (!user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
            return;
        }

        if (!allowedRoles.includes(user.role)) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions',
            });
            return;
        }

        next();
    };
};

export default { authenticateJWT, requireRole };
