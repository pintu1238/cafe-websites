import { Router } from 'express';
import type { AppConfig } from '../config/env.js';
import { optionalAuthenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import type { UserRepository } from '../types/domain.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resendVerificationSchema, resetPasswordSchema, verifyResetCodeSchema } from '../validators/auth.js';
import type { AuthService } from '../services/auth-service.js';
import { createAuthController } from '../controllers/auth-controller.js';
import { GoogleOAuthProvider, type GoogleAuthProvider } from '../services/google-oauth.js';
import type { Mailer } from '../services/mailer.js';

export function createAuthRouter(input: { service: AuthService; users: UserRepository; config: AppConfig; googleProvider?: GoogleAuthProvider; mailer?: Mailer }) {
  const router = Router();
  const controller = createAuthController(input.service, input.config, input.googleProvider ?? new GoogleOAuthProvider(input.config));

  router.post('/register', validate(registerSchema), controller.register);
  router.post('/login', validate(loginSchema), controller.login);
  router.get('/google', controller.googleStart);
  router.get('/google/callback', controller.googleCallback);
  router.post('/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword);
  router.post('/verify-reset-code', validate(verifyResetCodeSchema), controller.verifyResetCode);
  router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword);
  router.get('/verify-email', controller.verifyEmail);
  router.post('/resend-verification', validate(resendVerificationSchema), controller.resendVerification);
  router.post('/logout', controller.logout);
  router.get('/me', optionalAuthenticate(input.users, input.config), controller.me);
  return router;
}
