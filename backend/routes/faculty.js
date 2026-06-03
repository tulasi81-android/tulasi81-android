const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/facultyController');

// All routes require auth
router.use(auth);

// GET /api/faculty
router.get('/', ctrl.getAll);

// GET /api/faculty/:id
router.get('/:id', ctrl.getById);

// POST /api/faculty
router.post('/', [
  body('name').trim().notEmpty().withMessage('Faculty name is required'),
  body('department').notEmpty().withMessage('Department is required')
], validate, ctrl.create);

// POST /api/faculty/bulk
router.post('/bulk', ctrl.bulkCreate);

// PUT /api/faculty/:id
router.put('/:id', ctrl.update);

// DELETE /api/faculty/:id
router.delete('/:id', ctrl.remove);

module.exports = router;
