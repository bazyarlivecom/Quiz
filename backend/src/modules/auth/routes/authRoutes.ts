import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../../../shared/middleware/validation';
import { authenticate } from '../../../shared/middleware/auth';
import { loginSchema } from '../dto/loginDto';
import { registerSchema } from '../dto/registerDto';

const router = Router();
const authController = new AuthController();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/refresh', authController.refresh);

export default router;

