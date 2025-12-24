import express, { Express } from 'express';
import compression from 'compression';
import { setupSecurity } from './shared/middleware/security';
import { requestLogger } from './shared/middleware/logger';
import { errorHandler } from './shared/middleware/errorHandler';
import { authRoutes } from './modules/auth';
import { userRoutes } from './modules/users';
import { questionRoutes } from './modules/questions';
import { quizRoutes } from './modules/quiz';
import { leaderboardRoutes } from './modules/leaderboard';

const app: Express = express();

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
setupSecurity(app);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.use(errorHandler);

export default app;

