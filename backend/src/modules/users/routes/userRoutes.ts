import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();
const userController = new UserController();

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);

export default router;

