import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  SERVER_ORIGIN: z.string().url().default('http://localhost:4000'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters.'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  TAX_RATE_BPS: z.coerce.number().int().min(0).max(10000).default(500),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_REDIRECT_URI: z.string().url().default('http://localhost:4000/api/v1/auth/google/callback'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default(''),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  EMAIL_VERIFICATION_TTL_MINUTES: z.coerce.number().int().positive().default(30),
});

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  clientOrigin: string;
  serverOrigin: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  taxRateBps: number;
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  mailFrom: string;
  passwordResetTtlMinutes: number;
  emailVerificationTtlMinutes: number;
};

export const defaultAppConfig: AppConfig = {
  nodeEnv: 'test',
  port: 4000,
  clientOrigin: 'http://localhost:5173',
  serverOrigin: 'http://localhost:4000',
  databaseUrl: '',
  jwtSecret: 'test-only-secret-that-is-long-enough-123456',
  jwtExpiresIn: '2h',
  taxRateBps: 500,
  googleClientId: '',
  googleClientSecret: '',
  googleRedirectUri: 'http://localhost:4000/api/v1/auth/google/callback',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: '',
  smtpPass: '',
  mailFrom: '',
  passwordResetTtlMinutes: 30,
  emailVerificationTtlMinutes: 30,
};

export function getEnv(input: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.parse(input);
  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    clientOrigin: parsed.CLIENT_ORIGIN,
    serverOrigin: parsed.SERVER_ORIGIN,
    databaseUrl: parsed.DATABASE_URL,
    jwtSecret: parsed.JWT_SECRET,
    jwtExpiresIn: parsed.JWT_EXPIRES_IN,
    taxRateBps: parsed.TAX_RATE_BPS,
    googleClientId: parsed.GOOGLE_CLIENT_ID,
    googleClientSecret: parsed.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: parsed.GOOGLE_REDIRECT_URI,
    smtpHost: parsed.SMTP_HOST,
    smtpPort: parsed.SMTP_PORT,
    smtpSecure: parsed.SMTP_SECURE,
    smtpUser: parsed.SMTP_USER,
    smtpPass: parsed.SMTP_PASS,
    mailFrom: parsed.MAIL_FROM || parsed.SMTP_USER,
    passwordResetTtlMinutes: parsed.PASSWORD_RESET_TTL_MINUTES,
    emailVerificationTtlMinutes: parsed.EMAIL_VERIFICATION_TTL_MINUTES,
  };
}
