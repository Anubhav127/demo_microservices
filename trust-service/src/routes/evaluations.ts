import { Router, Response, Request } from 'express';
import { AuthenticatedRequest, authenticateJWT } from '../middleware';
import { Evaluation, EvaluationStatus, AIModel, Project } from '../models';
import { minioService, MinioService } from '../services';
import { sendEvaluationJob } from '../kafka';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// SSE clients for real-time updates
const sseClients = new Map<string, Response[]>();

/**
 * Send SSE update to all clients watching an evaluation
 */
export const sendSSEUpdate = (evaluationId: string, data: object): void => {
    const clients = sseClients.get(evaluationId) || [];
    const message = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach((client) => {
        try {
            client.write(message);
        } catch (e) {
            // Client disconnected
        }
    });
};

/**
 * POST /evaluations - Trigger a new evaluation
 */
router.post('/', authenticateJWT, upload.single('csv'), async (req, res: Response) => {
    try {
        const { user } = req as AuthenticatedRequest;
        const { projectId, modelId } = req.body;
        const csvFile = req.file;

        // Validate required fields
        if (!projectId || !modelId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Project ID and Model ID are required',
            });
        }

        // Verify project belongs to user
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Not Found', message: 'Project not found' });
        }
        if (project.userId !== user.userId) {
            return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        }

        // Verify model exists
        const model = await AIModel.findByPk(modelId);
        if (!model) {
            return res.status(404).json({ error: 'Not Found', message: 'Model not found' });
        }

        // Check for existing in-progress evaluation (lock)
        const existingLock = await Evaluation.findOne({
            where: {
                userId: user.userId,
                modelId,
                status: EvaluationStatus.IN_PROGRESS,
            },
        });

        if (existingLock) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'An evaluation is already in progress for this model',
            });
        }

        // Create evaluation record
        const evaluation = await Evaluation.create({
            userId: user.userId,
            projectId,
            modelId,
            status: EvaluationStatus.PENDING,
        });

        // Upload CSV to MinIO if provided
        let fileKey: string | null = null;
        if (csvFile) {
            fileKey = MinioService.generateKey(evaluation.id);
            await minioService.uploadCSV(fileKey, csvFile.buffer);
        }

        // Publish job to Kafka
        await sendEvaluationJob({
            evaluationId: evaluation.id,
            userId: user.userId,
            projectId,
            modelId,
            fileKey,
        });

        return res.status(201).json({
            id: evaluation.id,
            status: evaluation.status,
            createdAt: evaluation.createdAt,
        });
    } catch (error) {
        console.error('Create evaluation error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred while triggering the evaluation',
        });
    }
});

/**
 * GET /evaluations/:id - Get evaluation status and results
 */
router.get('/:id', authenticateJWT, async (req, res: Response) => {
    try {
        const { user } = req as AuthenticatedRequest;
        const { id } = req.params;

        const evaluation = await Evaluation.findByPk(id);

        if (!evaluation) {
            return res.status(404).json({ error: 'Not Found', message: 'Evaluation not found' });
        }

        if (evaluation.userId !== user.userId) {
            return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        }

        return res.status(200).json({
            id: evaluation.id,
            status: evaluation.status,
            accuracy: evaluation.accuracy,
            precision: evaluation.precision,
            recall: evaluation.recall,
            f1Score: evaluation.f1Score,
            createdAt: evaluation.createdAt,
        });
    } catch (error) {
        console.error('Get evaluation error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * GET /evaluations/:id/stream - SSE endpoint for real-time updates
 */
router.get('/:id/stream', authenticateJWT, async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;

    // Verify access
    const evaluation = await Evaluation.findByPk(id);
    if (!evaluation || evaluation.userId !== user.userId) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    // Setup SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Add client to watchers
    if (!sseClients.has(id)) {
        sseClients.set(id, []);
    }
    sseClients.get(id)!.push(res);

    // Send current status immediately
    res.write(`data: ${JSON.stringify({
        id: evaluation.id,
        status: evaluation.status,
        accuracy: evaluation.accuracy,
        precision: evaluation.precision,
        recall: evaluation.recall,
        f1Score: evaluation.f1Score,
    })}\n\n`);

    // Cleanup on disconnect
    req.on('close', () => {
        const clients = sseClients.get(id) || [];
        sseClients.set(id, clients.filter((c) => c !== res));
    });
});

export default router;
