let messageModel = require('../schemas/messages');
let mongoose = require('mongoose');

module.exports = {
    getMessagesBetweenUser: async function (req, res, next) {
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
    },

    sendMessage: async function (req, res, next) {
        try {
            let currentUserId = req.user._id;
            let toUserId = req.body.to;

            let type = "text";
            let text = req.body.text;

            if (req.file) {
                type = "file";
                text = req.file.path; // Or you could map it to a specific URL path
            } else if (!text) {
                return res.status(400).send({
                    success: false,
                    message: "Content string required if no file is sent."
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
    },

    getLastMessages: async function (req, res, next) {
        try {
            let currentUserId = new mongoose.Types.ObjectId(req.user._id);

            let messages = await messageModel.aggregate([
                {
                    $match: {
                        $or: [
                            { from: currentUserId },
                            { to: currentUserId }
                        ]
                    }
                },
                { $sort: { createdAt: -1 } },
                {
                    $group: {
                        _id: {
                            $cond: [
                                { $eq: ["$from", currentUserId] },
                                "$to",
                                "$from"
                            ]
                        },
                        lastMessage: { $first: "$$ROOT" }
                    }
                },
                { $replaceRoot: { newRoot: "$lastMessage" } },
                { $sort: { createdAt: -1 } }
            ]);

            // Populate the 'from' and 'to' users
            await messageModel.populate(messages, { path: "from to", select: "username fullName avatarUrl" });

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
    }
};
