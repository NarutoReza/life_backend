const express = require('express');
const router = express.Router();

const {addPdf, getPdf} = require('../Controllers/PdfController');

router.post('/add-pdf', addPdf);
router.post('/get-pdf', getPdf);

module.exports = router;