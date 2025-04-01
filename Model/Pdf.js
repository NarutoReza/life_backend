const mongoose = require('mongoose');

const Pdf = new mongoose.Schema({
  name: {type:String, required: true},
  file_name: {type:String, required: true},
  file_id: {type:String, required: true},
});

module.exports = mongoose.model('Pdf', Pdf);