const mongoose = require('mongoose');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const Grid = require('gridfs-stream');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

const conn = mongoose.connection;

let gfs;
let gridfsBucket;

conn.once('open', () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'uploads',
  });

  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload file route
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const uploadStream = gridfsBucket.openUploadStream(file.originalname, {
    contentType: file.mimetype,
  });

  uploadStream.end(file.buffer);

  uploadStream.on('finish', () => {
    res.status(200).json({
      message: 'File uploaded successfully',
      fileId: uploadStream.id,
      filename: uploadStream.filename,
    });
  });

  uploadStream.on('error', (err) => {
    res.status(500).json({ message: 'Upload error', error: err });
  });
});

app.get('/file/:filename', (req, res) => {
  const filename = req.params.filename;

  gfs.files.findOne({ filename: filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const readStream = gridfsBucket.openDownloadStreamByName(filename);
    res.set('Content-Type', file.contentType);
    readStream.pipe(res);
  });
});

app.get('/file/id/:id', (req, res) => {
  const id = req.params.id;

  gfs.files.findOne({ _id: mongoose.Types.ObjectId(id) }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const readStream = gridfsBucket.openDownloadStream(mongoose.Types.ObjectId(id));
    res.set('Content-Type', file.contentType);
    readStream.pipe(res);
  });
});

app.delete('/file/:id', (req, res) => {
  const id = req.params.id;

  gridfsBucket.delete(mongoose.Types.ObjectId(id), (err) => {
    if (err) {
      return res.status(500).json({ message: 'File deletion error', error: err });
    }
    res.status(200).json({ message: 'File deleted successfully' });
  });
});