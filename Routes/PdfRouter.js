const express = require('express');
const router = express.Router();

const {addPdf, getPdf} = require('../Controllers/PdfController');

router.post('/add', addPdf);
router.get('/get', getPdf);

module.exports = router;