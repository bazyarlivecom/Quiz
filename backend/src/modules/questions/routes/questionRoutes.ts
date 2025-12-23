import { Router } from 'express';
import { questionController } from '../controllers/questionController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

router.get('/categories', questionController.getCategories);
router.get('/random', authenticate, questionController.getRandomQuestions);
router.get('/:id', authenticate, questionController.getQuestionById);

export default router;



