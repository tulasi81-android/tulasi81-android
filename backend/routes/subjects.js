const express = require('express');
const router = express.Router();
const multer = require('multer');
const subjectController = require('../controllers/subjectController');

// Multer config (store file in memory buffer)
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', subjectController.getAll);
router.post('/', subjectController.create);
router.delete('/:id', subjectController.remove);
router.post('/import-pdf', upload.single('file'), subjectController.importPdf);

module.exports = router;
