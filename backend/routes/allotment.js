const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/allotmentController');

// All routes require auth
router.use(auth);

// POST /api/allotment/run
router.post('/run', [
  body('examName').trim().notEmpty().withMessage('Exam name is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
  body('roomsNeeded').isInt({ min: 1, max: 20 }).withMessage('Rooms needed must be between 1 and 20')
], validate, ctrl.run);

module.exports = router;
