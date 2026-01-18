import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateJWT } from '../middleware';
import { Project } from '../models';

const router = Router();

/**
 * POST /projects - Create a new project
 */
router.post('/', authenticateJWT, async (req, res: Response) => {
    try {
        const { user } = req as AuthenticatedRequest;
        const { name } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Project name is required',
            });
        }

        const project = await Project.create({
            userId: user.userId,
            name: name.trim(),
        });

        return res.status(201).json({
            id: project.id,
            name: project.name,
            createdAt: project.createdAt,
        });
    } catch (error) {
        console.error('Create project error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred while creating the project',
        });
    }
});

/**
 * GET /projects - List user's projects
 */
router.get('/', authenticateJWT, async (req, res: Response) => {
    try {
        const { user } = req as AuthenticatedRequest;

        const projects = await Project.findAll({
            where: { userId: user.userId },
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json(
            projects.map((p) => ({
                id: p.id,
                name: p.name,
                createdAt: p.createdAt,
            }))
        );
    } catch (error) {
        console.error('List projects error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred while fetching projects',
        });
    }
});

export default router;
