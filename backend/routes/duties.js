const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/dutyController');

// All routes require auth
router.use(auth);

// GET /api/duties/stats (must be before /:id to avoid conflict)
router.get('/stats', ctrl.getStats);

// GET /api/duties
router.get('/', ctrl.getAll);

// GET /api/duties/:id
router.get('/:id', ctrl.getById);

// POST /api/duties
router.post('/', [
  body('facultyName').trim().notEmpty().withMessage('Faculty name is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('examName').trim().notEmpty().withMessage('Exam name is required'),
  body('roomNo').trim().notEmpty().withMessage('Room number is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required')
], validate, ctrl.create);

// PUT /api/duties/:id
router.put('/:id', ctrl.update);

// DELETE /api/duties/:id
router.delete('/:id', ctrl.remove);

module.exports = router;
