const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { login, register, getMe } = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, login);

// POST /api/auth/register (protected — only logged-in admins can create new admins)
router.post('/register', auth, [
  body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3 }),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 3 }),
  body('role').optional().isIn(['admin', 'superadmin'])
], validate, register);

// GET /api/auth/me
router.get('/me', auth, getMe);

module.exports = router;
