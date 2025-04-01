const mongoose = require('mongoose');
const multer = require('multer');
const { GridFSBucket, ObjectId } = require('mongodb');
const Grid = require('gridfs-stream');
require('dotenv').config();
const path = require('path');

const Video = require('../Model/Video');
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

function generateFilename(originalname) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  const ext = path.extname(originalname) || "";
  // Example: "ChatGPT Video 2025-03-31_19-51-40.png"
  return `${year}-${month}-${day}_${hour}-${minute}-${second}${ext}`;
}


exports.addVideo = [
  upload.single('file'),
  async (req, res) => {
    const file = req.file;
    const {name} = req.body;
  
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
  
    try {
      if(!name) {
        res.status(405).json({message: "Some input fields are missing."});
      } else if (name.trim() === "") {
        res.status(405).json({message: "Some input fields are empty."});
      } else {
        const findVideo = await Video.findOne({name});
  
        if(findVideo) {
          res.status(405).json({message: "There is already a video saved with this name."});
        } else {
          const uploadStream = gridfsBucket.openUploadStream(generateFilename(file.originalname), {
            contentType: file.mimetype,
          });
        
          uploadStream.end(file.buffer);
        
          uploadStream.on('finish', async () => {
            await new Video({name, file_name: uploadStream.filename, file_id: uploadStream.id}).save();
            res.status(201).json({message: "Video saved successfully", name: generateFilename(file.originalname)});
          });
        
          uploadStream.on('error', (err) => {
            res.status(500).json({ message: 'Upload error', error: err });
          });
        }
      }
    } catch (error) {
      res.status(400).json({message: "Error adding a new video"});
    }
  }
];

exports.getVideo = async (req, res) => {
  const {name} = req.body;
  try {
    if (!name) {
      return res.status(405).json({message: "Some input fields are missing."});
    }
    
    if (name.trim() === "") {
      return res.status(405).json({message: "Some input fields are empty."});
    }
    
    const findVideo = await Video.findOne({name});
    console.log(findVideo);

    if (!findVideo) {
      return res.status(405).json({message: "There is noa video saved with this name."});
    }
    
    const fileId = new mongoose.Types.ObjectId(findVideo.file_id);
    
    const file = await mongoose.connection.db
      .collection('uploads.files')
      .findOne({ _id: fileId });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    console.log(file);

    const chunks = await mongoose.connection.db
      .collection('uploads.chunks')
      .find({ files_id: fileId })
      .toArray();

    console.log(chunks.length);

    const readStream = gridfsBucket.openDownloadStream(fileId);

    // Attach event listeners for debugging purposes.
    readStream.on("data", (chunk) => {
      console.log("Streaming chunk of size:", chunk.length);
    });
    readStream.on("end", () => {
      console.log("Download stream ended");
    });
    readStream.on("close", () => {
      console.log("Download stream closed");
    });
    readStream.on("error", (streamError) => {
      console.error("Download stream error:", streamError);
      // Ensure that if an error occurs, you send a response if it hasn't been sent already.
      if (!res.headersSent) {
        return res.status(500).json({ message: "Error retrieving file", error: streamError });
      }
    });

    // Set the Content-Type header from file metadata and pipe the stream to the response.
    res.set("Content-Type", file.contentType);
    readStream.pipe(res);
  } catch (error) {
    res.status(400).json({message: "Error retrieving video", error});
  }
};