import { Router, Response, Request } from 'express';
import axios from 'axios';
import { authenticateJWT } from '../middleware';

const router = Router();
const TRUST_SERVICE_URL = process.env.TRUST_SERVICE_URL || 'http://localhost:3002';

/**
 * POST /models - Proxy to Trust Service
 */
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    try {
        const response = await axios.post(
            `${TRUST_SERVICE_URL}/models`,
            req.body,
            { headers: { Authorization: req.headers.authorization } }
        );
        res.status(response.status).json(response.data);
    } catch (error: any) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(502).json({ error: 'Bad Gateway', message: 'Trust service unavailable' });
        }
    }
});

/**
 * POST /models/link - Proxy to Trust Service
 */
router.post('/link', authenticateJWT, async (req: Request, res: Response) => {
    try {
        const response = await axios.post(
            `${TRUST_SERVICE_URL}/models/link`,
            req.body,
            { headers: { Authorization: req.headers.authorization } }
        );
        res.status(response.status).json(response.data);
    } catch (error: any) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(502).json({ error: 'Bad Gateway', message: 'Trust service unavailable' });
        }
    }
});

export default router;
