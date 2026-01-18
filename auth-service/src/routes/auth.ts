import { Router, Request, Response } from 'express';
import { User, UserRole } from '../models';
import { passwordHasher, jwtService } from '../services';

const router = Router();

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password validation rules
 * - At least 8 characters
 */
const isPasswordValid = (password: string): boolean => {
    return password.length >= 8;
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
 * Authenticate user and return JWT token
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

        // Generate JWT token
        const accessToken = jwtService.sign({
            userId: user.id,
            role: user.role,
        });

        // Return success response
        return res.status(200).json({
            accessToken,
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred during login',
        });
    }
});

export default router;
