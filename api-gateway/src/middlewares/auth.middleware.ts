import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from '../utils/api-error';
import { logger } from '../lib/logger';

/**
 * JWT payload interface - defined inline per requirements
 */
interface JWTPayload {
    userId: string;
    role: 'SUPER_ADMIN' | 'USER';
    iat?: number;
    exp?: number;
}

/**
 * Extended request with authenticated user context
 */
export interface AuthenticatedRequest extends Request {
    user: JWTPayload;
}

/**
 * Extract JWT token from Authorization header
 */
const extractToken = (authHeader: string | undefined): string | null => {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
};

/**
 * Authentication middleware
 * - Extracts JWT from Authorization header
 * - Verifies token signature and expiration
 * - Attaches user context to request
 * - Rejects unauthorized requests
 */
export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const token = extractToken(req.headers.authorization);

    if (!token) {
        logger.debug('Auth failed: No token provided');
        throw ApiError.unauthorized('Missing authentication token');
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

        // Attach user context to request
        (req as AuthenticatedRequest).user = {
            userId: decoded.userId,
            role: decoded.role,
            iat: decoded.iat,
            exp: decoded.exp,
        };

        logger.debug(`Auth success: userId=${decoded.userId}, role=${decoded.role}`);
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logger.debug('Auth failed: Token expired');
            throw ApiError.unauthorized('Token has expired');
        }

        if (error instanceof jwt.JsonWebTokenError) {
            logger.debug('Auth failed: Invalid token');
            throw ApiError.unauthorized('Invalid token');
        }

        throw error;
    }
};

/**
 * Role-based access control middleware factory
 * @param allowedRoles - Roles that can access the protected route
 */
export const requireRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as AuthenticatedRequest).user;

        if (!user) {
            throw ApiError.unauthorized('Authentication required');
        }

        if (!allowedRoles.includes(user.role)) {
            logger.debug(`Role check failed: ${user.role} not in [${allowedRoles.join(', ')}]`);
            throw ApiError.forbidden('Insufficient permissions');
        }

        next();
    };
};
