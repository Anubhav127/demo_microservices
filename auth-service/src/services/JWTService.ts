import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

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
 * JWTService class
 * Handles JWT token generation and verification
 */
export class JWTService {
    private readonly secret: string;
    private readonly expiresIn: string;

    constructor(secret?: string, expiresIn?: string) {
        this.secret = secret || process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
        this.expiresIn = expiresIn || process.env.JWT_EXPIRATION || '24h';
    }

    /**
     * Sign a JWT token with user claims
     * @param payload - Object containing userId and role
     * @returns Signed JWT token string
     */
    sign(payload: { userId: string; role: string }): string {
        return jwt.sign(payload, this.secret, {
            expiresIn: this.expiresIn as string | number,
        } as SignOptions);
    }

    /**
     * Verify and decode a JWT token
     * @param token - The JWT token to verify
     * @returns Decoded payload if valid
     * @throws Error if token is invalid or expired
     */
    verify(token: string): JWTPayload {
        try {
            const decoded = jwt.verify(token, this.secret) as JwtPayload;
            return {
                userId: decoded.userId,
                role: decoded.role,
                iat: decoded.iat,
                exp: decoded.exp,
            };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Token has expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid token');
            }
            throw error;
        }
    }
}

// Export singleton instance
export const jwtService = new JWTService();

export default JWTService;
