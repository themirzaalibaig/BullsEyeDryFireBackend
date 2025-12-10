import dotenv from 'dotenv';

dotenv.config();

const unsafePorts = new Set<number>([6000, 6665, 6666, 6667, 6668, 6669, 10080]);
const parsePort = (v: string | undefined): number => {
  const p = Number(v || 4000);
  return unsafePorts.has(p) ? 4000 : p;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parsePort(process.env.PORT),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 100),
  CORS_ORIGIN: (process.env.CORS_ORIGIN || '*').split(','),
  DATABASE_URL: process.env.DATABASE_URL || '',
  API_PREFIX: process.env.API_PREFIX || '/api',
  API_VERSION: process.env.API_VERSION || 'v1',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_API_BASE_URL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
  OPENAI_API_MODEL: process.env.OPENAI_API_MODEL || 'gpt-5',
  get BASE_API_PATH(): string {
    return this.API_PREFIX;
  },
  get VERSIONED_API_PATH(): string {
    return `${this.API_PREFIX}/${this.API_VERSION}`;
  },
};
