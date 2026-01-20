import { Router } from 'express';
import authRouter from './auth.routes';

const router = Router();

// Mount auth routes
router.use('/auth', authRouter);

export default router;
