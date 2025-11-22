import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware';
import { adminRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// All admin routes require authentication
router.use(authenticateToken);
router.use(adminRateLimiter);

// Routes with specific permission requirements
router.get('/users', requirePermission('users.read'), adminController.getUsers.bind(adminController));
router.get('/users/:id', requirePermission('users.read'), adminController.getUserById.bind(adminController));
router.patch('/users/:id', requirePermission('users.write'), adminController.updateUser.bind(adminController));

router.get('/tokens', requirePermission('admin.tokens'), adminController.getRefreshTokens.bind(adminController));
router.post('/tokens/:id/revoke', requirePermission('admin.tokens'), adminController.revokeToken.bind(adminController));

router.get('/login-attempts', requirePermission('admin.logs'), adminController.getLoginAttempts.bind(adminController));

router.get('/stats', requirePermission('admin.stats'), adminController.getStats.bind(adminController));

router.get('/tables/:table', requirePermission('admin.panel'), adminController.getTableData.bind(adminController));

// User management
router.get('/users', adminController.getUsers.bind(adminController));
router.get('/users/:id', adminController.getUserById.bind(adminController));
router.patch('/users/:id', adminController.updateUser.bind(adminController));

// Token management
router.get('/tokens', adminController.getRefreshTokens.bind(adminController));
router.post('/tokens/:id/revoke', adminController.revokeToken.bind(adminController));

// Security logs
router.get('/login-attempts', adminController.getLoginAttempts.bind(adminController));

// Statistics
router.get('/stats', adminController.getStats.bind(adminController));

// Table data (generic)
router.get('/tables/:table', adminController.getTableData.bind(adminController));

export default router;

