import express, { Express } from 'express';
import compression from 'compression';
import cors from 'cors';
import { setupSecurity } from './shared/middleware/security';
import { requestLogger } from './shared/middleware/logger';
import { errorHandler } from './shared/middleware/errorHandler';
import { env } from './shared/config/env';
import { authRoutes } from './modules/auth';
import { userRoutes } from './modules/users';
import { questionRoutes } from './modules/questions';
import { quizRoutes } from './modules/quiz';
import { leaderboardRoutes } from './modules/leaderboard';

const app: Express = express();

// CORS must be configured before other middleware
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = env.security.corsOrigin.split(',').map(o => o.trim());
    
    // In development, allow localhost origins
    if (env.nodeEnv === 'development') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS. Origin: ${origin}, Allowed: ${allowedOrigins.join(', ')}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
setupSecurity(app);

import { healthCheck } from './infrastructure/monitoring/healthCheck';

app.get('/health', healthCheck);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.use(errorHandler);

export default app;

