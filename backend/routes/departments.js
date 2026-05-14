const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/departmentController');

// All routes require auth
router.use(auth);

// GET /api/departments
router.get('/', ctrl.getAll);

// POST /api/departments
router.post('/', [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('code').trim().notEmpty().withMessage('Department code is required')
], validate, ctrl.create);

// PUT /api/departments/:id
router.put('/:id', ctrl.update);

// DELETE /api/departments/:id
router.delete('/:id', ctrl.remove);

module.exports = router;
