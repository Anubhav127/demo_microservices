import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

/**
 * POST /auth/register
 * Proxy to auth-service
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/register`, req.body);
        return res.status(response.status).json(response.data);
    } catch (error: any) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Auth service unavailable',
        });
    }
});

/**
 * POST /auth/login
 * Proxy to auth-service
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/login`, req.body);
        return res.status(response.status).json(response.data);
    } catch (error: any) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Auth service unavailable',
        });
    }
});

export default router;
