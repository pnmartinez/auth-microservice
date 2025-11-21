import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import {
  validateRegister,
  validateLogin,
  validatePasswordReset,
  validatePasswordResetConfirm,
} from '../middleware/validation.middleware';
import { authRateLimiter, loginRateLimiter } from '../middleware/rateLimit.middleware';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post(
  '/register',
  authRateLimiter,
  validateRegister,
  authController.register.bind(authController)
);

router.post(
  '/login',
  loginRateLimiter,
  validateLogin,
  authController.login.bind(authController)
);

router.get('/azure', authController.azureLogin.bind(authController));
router.get('/azure/callback', authController.azureCallback.bind(authController));

router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post(
  '/resend-verification',
  authRateLimiter,
  authController.resendVerification.bind(authController)
);

router.post(
  '/password-reset',
  authRateLimiter,
  validatePasswordReset,
  authController.requestPasswordReset.bind(authController)
);

router.post(
  '/password-reset/confirm',
  authRateLimiter,
  validatePasswordResetConfirm,
  authController.resetPassword.bind(authController)
);

router.post('/refresh', authController.refreshToken.bind(authController));

// Protected routes
router.post('/logout', authenticateToken, authController.logout.bind(authController));
router.get('/me', authenticateToken, authController.getCurrentUser.bind(authController));

export default router;

