import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { authService } from '../services/auth.service';
import { roleService } from '../services/role.service';
import { AuthorizationError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = verifyToken(token);
    
    if (decoded.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    // Verify user still exists and is active
    const user = await authService.getUserById(decoded.userId);
    if (!user || !user.is_active) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (process.env.ADMIN_PANEL_ENABLED !== 'true') {
    res.status(403).json({ error: 'Admin access disabled' });
    return;
  }

  const isAdmin = await roleService.hasRole(req.user.userId, 'admin');
  if (!isAdmin) {
    throw new AuthorizationError('Admin access required');
  }

  next();
}

export function requirePermission(permission: string) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasPermission = await roleService.hasPermission(req.user.userId, permission);
    if (!hasPermission) {
      throw new AuthorizationError(`Permission required: ${permission}`);
    }

    next();
  };
}

