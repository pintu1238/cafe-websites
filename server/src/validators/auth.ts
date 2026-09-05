import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(30).optional(),
  universityId: z.string().trim().max(80).optional(),
  studentId: z.string().trim().max(80).optional(),
  role: z.literal('CUSTOMER').optional(),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(128),
}).strict();

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(200),
}).strict();

export const verifyResetCodeSchema = z.object({
  email: z.string().trim().email().max(200),
  code: z.string().trim().regex(/^\d{6}$/),
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().trim().regex(/^[a-f0-9]{64}$/),
  password: z.string().min(8).max(128),
}).strict();

export const resendVerificationSchema = z.object({
  email: z.string().trim().email().max(200),
}).strict();

export const emailVerificationTokenSchema = z.object({
  token: z.string().trim().regex(/^[a-f0-9]{64}$/),
}).strict();
