const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/timetableController');

// All routes require auth
router.use(auth);

// GET /api/timetables
router.get('/', ctrl.getAll);

// GET /api/timetables/:facultyName
router.get('/:facultyName', ctrl.getByFaculty);

// POST /api/timetables
router.post('/', [
  body('facultyName').trim().notEmpty().withMessage('Faculty name is required'),
  body('schedule').notEmpty().withMessage('Schedule is required')
], validate, ctrl.createOrUpdate);

// POST /api/timetables/bulk
router.post('/bulk', ctrl.bulkImport);

// DELETE /api/timetables/:id
router.delete('/:id', ctrl.remove);

module.exports = router;
