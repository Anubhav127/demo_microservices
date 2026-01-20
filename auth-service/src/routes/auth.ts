import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { User, UserRole, RefreshToken } from '../models';
import { passwordHasher, jwtService } from '../services';

const router = Router();

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password validation rules - At least 8 characters
 */
const isPasswordValid = (password: string): boolean => {
    return password.length >= 8;
};

/**
 * Generate a secure refresh token
 */
const generateRefreshToken = (): string => {
    return crypto.randomBytes(64).toString('hex');
};

/**
 * Refresh token expiration (7 days)
 */
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Calculate refresh token expiration date
 */
const getRefreshTokenExpiry = (): Date => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    return expiry;
};

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate email presence
        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Email is required',
            });
        }

        // Validate email format
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid email format',
            });
        }

        // Validate password presence
        if (!password || typeof password !== 'string') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Password is required',
            });
        }

        // Validate password strength
        if (!isPasswordValid(password)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Password does not meet requirements (minimum 8 characters)',
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Email already registered',
            });
        }

        // Hash password
        const passwordHash = await passwordHasher.hash(password);

        // Create user with USER role by default
        const user = await User.create({
            email,
            passwordHash,
            role: UserRole.USER,
        });

        // Return success response
        return res.status(201).json({
            userId: user.id,
            email: user.email,
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred during registration',
        });
    }
});

/**
 * POST /auth/login
 * Authenticate user and return access + refresh tokens
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate email presence
        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Email is required',
            });
        }

        // Validate password presence
        if (!password || typeof password !== 'string') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Password is required',
            });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password',
            });
        }

        // Verify password
        const isValid = await passwordHasher.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password',
            });
        }

        // Generate access token (short-lived)
        const accessToken = jwtService.sign({
            userId: user.id,
            role: user.role,
        });

        // Generate refresh token (long-lived)
        const refreshTokenStr = generateRefreshToken();
        const expiresAt = getRefreshTokenExpiry();

        // Store refresh token in database
        await RefreshToken.create({
            userId: user.id,
            token: refreshTokenStr,
            expiresAt,
        });

        // Return tokens
        return res.status(200).json({
            accessToken,
            refreshToken: refreshTokenStr,
            expiresIn: process.env.JWT_EXPIRATION || '15m',
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred during login',
        });
    }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        // Validate refresh token presence
        if (!refreshToken || typeof refreshToken !== 'string') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Refresh token is required',
            });
        }

        // Find refresh token in database
        const tokenRecord = await RefreshToken.findOne({
            where: { token: refreshToken },
            include: [{ model: User, as: 'user' }],
        });

        if (!tokenRecord) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid refresh token',
            });
        }

        // Check if token is expired
        if (tokenRecord.isExpired()) {
            // Delete expired token
            await tokenRecord.destroy();
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Refresh token has expired',
            });
        }

        // Get user from association
        const user = tokenRecord.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found',
            });
        }

        // Generate new access token
        const accessToken = jwtService.sign({
            userId: user.id,
            role: user.role,
        });

        return res.status(200).json({
            accessToken,
            expiresIn: process.env.JWT_EXPIRATION || '15m',
        });
    } catch (error) {
        console.error('Refresh error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred during token refresh',
        });
    }
});

/**
 * POST /auth/logout
 * Invalidate refresh token (trusts API Gateway headers)
 * 
 * Gateway injects:
 * - x-user-id: User ID from JWT
 * - x-logout: true
 * - x-authenticated: true
 */
router.post('/logout', async (req: Request, res: Response) => {
    try {
        // Trust gateway headers - do NOT verify JWT here
        const userId = req.headers['x-user-id'] as string;
        const isLogout = req.headers['x-logout'] === 'true';

        // Validate gateway headers
        if (!userId || !isLogout) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid logout request - missing gateway headers',
            });
        }

        // Delete all refresh tokens for this user
        const deletedCount = await RefreshToken.destroy({
            where: { userId },
        });

        console.log(`Logout: Deleted ${deletedCount} refresh token(s) for user ${userId}`);

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred during logout',
        });
    }
});

export default router;
