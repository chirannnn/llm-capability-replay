import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default('gpt-4'),
  MARINER_PRO_URL: z.string().url().optional(),
  DISCOVERY_MAX_STEPS: z.string().transform(Number).default('20'),
  DISCOVERY_TIMEOUT: z.string().transform(Number).default('300000'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }
  
  return result.data;
}

export const env = validateEnv();
