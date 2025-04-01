const express = require('express');
const router = express.Router();

const {addVideo, getVideo} = require('../Controllers/VideoController');

router.post('/add-video', addVideo);
router.post('/get-video', getVideo);

module.exports = router;