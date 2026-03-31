var express = require("express");
var router = express.Router();
let { CheckLogin } = require('../utils/authHandler');
let messageController = require('../controllers/messages');
let { uploadFile } = require('../utils/uploadHandler');

router.use(CheckLogin);

// Get last message for each user chatted with
router.get('/', messageController.getLastMessages);

// Post a new message
router.post('/', uploadFile.single('file'), messageController.sendMessage);

// Get messages between current user and :userID
router.get('/:userID', messageController.getMessagesBetweenUser);

module.exports = router;
