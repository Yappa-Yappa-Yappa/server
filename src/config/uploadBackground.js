// config/uploadBackground.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "yappa/backgrounds",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1500, crop: "limit" }], // wide banner-style, no forced crop — preserves aspect ratio
  },
});

module.exports = multer({ storage });
