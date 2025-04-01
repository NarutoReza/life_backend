const express = require('express');
const router = express.Router();

const {addAudio, getAudio, getAllAudiosList, editAudioFile, deleteAudioFile} = require('../Controllers/AudioController');

router.post('/add-audio', addAudio);
router.post('/get-audio', getAudio);
router.get('/list', getAllAudiosList);
router.post('/edit-audio', editAudioFile);
router.post('/delete-audio', deleteAudioFile);

module.exports = router;