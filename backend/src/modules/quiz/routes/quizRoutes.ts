import { Router } from 'express';
import { quizController } from '../controllers/quizController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

router.post('/start', authenticate, quizController.startQuiz);
router.get('/:matchId/question', authenticate, quizController.getCurrentQuestion);
router.post('/:matchId/answer', authenticate, quizController.submitAnswer);
router.get('/:matchId/result', authenticate, quizController.getResult);

export default router;



