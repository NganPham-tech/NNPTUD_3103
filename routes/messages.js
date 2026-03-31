var express = require("express");
var router = express.Router();
let { CheckLogin } = require('../utils/authHandler');
let { uploadFile } = require('../utils/uploadHandler');
let messageModel = require('../schemas/messages');
let mongoose = require('mongoose');

router.use(CheckLogin);


router.get('/', async function (req, res, next) {
    try {
        let currentUserId = req.user._id;

        
        let allMessages = await messageModel.find({
            $or: [
                { from: currentUserId },
                { to: currentUserId }
            ]
        })
        .sort({ createdAt: -1 }) 
        .populate('from', 'username fullName avatarUrl')
        .populate('to', 'username fullName avatarUrl');

        
        let latestMessages = [];
        let seenUsers = {}; 

        for (let i = 0; i < allMessages.length; i++) {
            let msg = allMessages[i];
            
        
            let otherUserId = "";
            if (msg.from._id.toString() === currentUserId.toString()) {
                otherUserId = msg.to._id.toString(); 
            } else {
                otherUserId = msg.from._id.toString(); 
            }

           
            if (!seenUsers[otherUserId]) {
                seenUsers[otherUserId] = true; 
                latestMessages.push(msg);      
            }
        }

        res.status(200).send({
            success: true,
            data: latestMessages
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message
        });
    }
});

router.post('/', uploadFile.single('file'), async function (req, res, next) {
    try {
        let currentUserId = req.user._id;
        let toUserId = req.body.to;

        let type = "text";
        let text = req.body.text;

        if (req.file) {
            type = "file";
            text = req.file.path;
        } else if (!text) {
            return res.status(400).send({
                success: false,
                message: "khong co file nao duoc gui"
            });
        }

        let newMessage = new messageModel({
            from: currentUserId,
            to: toUserId,
            messageContent: {
                type: type,
                text: text
            }
        });

        await newMessage.save();

        res.status(201).send({
            success: true,
            data: newMessage
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message
        });
    }
});

router.get('/:userID', async function (req, res, next) {
    try {
        let currentUserId = req.user._id;
        let otherUserId = req.params.userID;

        let messages = await messageModel.find({
            $or: [
                { from: currentUserId, to: otherUserId },
                { from: otherUserId, to: currentUserId }
            ]
        }).sort({ createdAt: 1 }).populate('from', 'username fullName avatarUrl').populate('to', 'username fullName avatarUrl');

        res.status(200).send({
            success: true,
            data: messages
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
