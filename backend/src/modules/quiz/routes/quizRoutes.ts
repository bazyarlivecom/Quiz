import { Router } from 'express';
import { QuizController } from '../controllers/quizController';
import { validate } from '../../../shared/middleware/validation';
import { authenticate } from '../../../shared/middleware/auth';
import { startGameSchema } from '../dto/startGameDto';
import { submitAnswerSchema } from '../dto/submitAnswerDto';

const router = Router();
const quizController = new QuizController();

router.get('/active', authenticate, quizController.getActiveGame);
router.post('/start', authenticate, validate(startGameSchema), quizController.startGame);
router.get('/:sessionId/current-question', authenticate, quizController.getCurrentQuestion);
router.post('/:sessionId/answer', authenticate, validate(submitAnswerSchema), quizController.submitAnswer);
router.post('/:sessionId/end', authenticate, quizController.endGame);
router.post('/:sessionId/abandon', authenticate, quizController.abandonGame);

export default router;

