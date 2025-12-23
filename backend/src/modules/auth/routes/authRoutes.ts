import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;



