const express = require("express");
const { createPostController } = require("../controller/image.controller");
const multer = require("multer");

const route = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

route.post("/image", upload.single("image"), createPostController);

module.exports = route;
