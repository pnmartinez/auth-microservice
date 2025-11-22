import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { azureService } from '../services/azure.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.register({ email, password });
      
      res.status(201).json({
        message: 'User registered successfully. Please check your email for verification.',
        user: {
          id: result.user.id,
          email: result.user.email,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({ error: message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      
      const result = await authService.login({ email, password }, ipAddress);
      
      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        accessToken: result.accessToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          emailVerified: result.user.email_verified,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ error: message });
    }
  }

  async azureLogin(_req: Request, res: Response): Promise<void> {
    try {
      const authUrl = await azureService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate Azure login';
      res.status(500).json({ error: message });
    }
  }

  async azureCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;
      
      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Authorization code is required' });
        return;
      }

      const tokenResponse = await azureService.exchangeCodeForToken(code);
      const userInfo = await azureService.extractUserInfo(tokenResponse.idToken!);
      
      const result = await authService.loginWithAzure(
        userInfo.azureId,
        userInfo.email,
        userInfo.name
      );

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend without exposing tokens in the URL
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Azure authentication failed';
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(message)}`);
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Verification token is required' });
        return;
      }

      await authService.verifyEmail(token);
      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email verification failed';
      res.status(400).json({ error: message });
    }
  }

  async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      await authService.resendVerificationEmail(email);
      res.json({ message: 'Verification email sent' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend verification email';
      res.status(400).json({ error: message });
    }
  }

  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      await authService.requestPasswordReset(email);
      // Always return success to prevent email enumeration
      res.json({ message: 'If the email exists, a password reset link has been sent' });
    } catch (error) {
      // Still return success to prevent email enumeration
      res.json({ message: 'If the email exists, a password reset link has been sent' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      res.status(400).json({ error: message });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Try to get refresh token from cookie first, then from body
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      
      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token is required' });
        return;
      }

      const accessToken = await authService.refreshAccessToken(refreshToken);
      res.json({ accessToken });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({ error: message });
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie('refreshToken');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      res.status(400).json({ error: message });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const user = await authService.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          lastLogin: user.last_login,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(500).json({ error: message });
    }
  }
}

export const authController = new AuthController();

