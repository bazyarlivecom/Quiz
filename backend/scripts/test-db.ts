import dotenv from 'dotenv';
dotenv.config();

import { testConnection } from '../src/shared/database/testConnection';

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});

