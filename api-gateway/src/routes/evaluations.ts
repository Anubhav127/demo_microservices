import { Router, Response, Request } from 'express';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import { authenticateJWT } from '../middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const TRUST_SERVICE_URL = process.env.TRUST_SERVICE_URL || 'http://localhost:3002';

/**
 * POST /evaluations - Proxy to Trust Service (with file upload)
 */
router.post('/', authenticateJWT, upload.single('csv'), async (req: Request, res: Response) => {
    try {
        const formData = new FormData();

        // Append body fields
        if (req.body.projectId) formData.append('projectId', req.body.projectId);
        if (req.body.modelId) formData.append('modelId', req.body.modelId);

        // Append file if present
        if ((req as any).file) {
            formData.append('csv', (req as any).file.buffer, {
                filename: (req as any).file.originalname,
                contentType: 'text/csv',
            });
        }

        const response = await axios.post(
            `${TRUST_SERVICE_URL}/evaluations`,
            formData,
            {
                headers: {
                    Authorization: req.headers.authorization,
                    ...formData.getHeaders(),
                }
            }
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
 * GET /evaluations/:id - Proxy to Trust Service
 */
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
        const response = await axios.get(
            `${TRUST_SERVICE_URL}/evaluations/${req.params.id}`,
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
 * GET /evaluations/:id/stream - Proxy SSE to Trust Service
 * Note: EventSource doesn't support custom headers, so token is passed via query param
 */
router.get('/:id/stream', async (req: Request, res: Response) => {
    // Get token from query parameter (EventSource can't send headers)
    const token = req.query.token as string;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }

    try {
        const response = await axios.get(
            `${TRUST_SERVICE_URL}/evaluations/${req.params.id}/stream`,
            {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'stream',
            }
        );

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        response.data.pipe(res);

        req.on('close', () => {
            response.data.destroy();
        });
    } catch (error: any) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(502).json({ error: 'Bad Gateway', message: 'Trust service unavailable' });
        }
    }
});

export default router;
