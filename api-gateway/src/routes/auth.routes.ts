import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';
import { authPublicProxy, authLogoutProxy } from '../proxy/auth.proxy';

const router = Router();

/**
 * Public auth routes (no authentication required)
 * Rate limited to prevent brute force attacks
 */

// POST /auth/register - Register a new user
router.post('/register', authRateLimiter, authPublicProxy);

// POST /auth/login - Authenticate and get tokens
router.post('/login', authRateLimiter, authPublicProxy);

// POST /auth/refresh - Refresh access token
router.post('/refresh', authRateLimiter, authPublicProxy);

/**
 * Protected auth routes (authentication required)
 */

// POST /auth/logout - Invalidate refresh token
router.post('/logout', authMiddleware, authLogoutProxy);

export default router;
