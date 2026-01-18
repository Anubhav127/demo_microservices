import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateJWT } from '../middleware';
import { AIModel, Project, ProjectModel } from '../models';

const router = Router();

/**
 * POST /models - Register a new AI model
 */
router.post('/', authenticateJWT, async (req, res: Response) => {
    try {
        const { modelName, endpointUrl } = req.body;

        if (!modelName || typeof modelName !== 'string') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Model name is required',
            });
        }

        if (!endpointUrl || typeof endpointUrl !== 'string') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Endpoint URL is required',
            });
        }

        // Basic URL validation
        try {
            new URL(endpointUrl);
        } catch {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid endpoint URL format',
            });
        }

        const model = await AIModel.create({ modelName, endpointUrl });

        return res.status(201).json({
            id: model.id,
            modelName: model.modelName,
            endpointUrl: model.endpointUrl,
            createdAt: model.createdAt,
        });
    } catch (error) {
        console.error('Create model error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred while registering the model',
        });
    }
});

/**
 * POST /models/link - Link a model to a project
 */
router.post('/link', authenticateJWT, async (req, res: Response) => {
    try {
        const { user } = req as AuthenticatedRequest;
        const { projectId, modelId } = req.body;

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

        // Check if already linked
        const existing = await ProjectModel.findOne({ where: { projectId, modelId } });
        if (existing) {
            return res.status(409).json({ error: 'Conflict', message: 'Already linked' });
        }

        await ProjectModel.create({ projectId, modelId });

        return res.status(201).json({ message: 'Model linked to project', projectId, modelId });
    } catch (error) {
        console.error('Link model error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
