const Notification = require("../models/notification.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    $or: [{ user: req.user._id }, { targetRole: req.user.role }],
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: notifications,
  });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    $or: [{ user: req.user._id }, { targetRole: req.user.role }],
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  notification.isRead = true;
  await notification.save();

  res.json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
});

const createBroadcastNotification = asyncHandler(async (req, res) => {
  const { userId, targetRole, title, message, type, metadata } = req.body;

  if (!title || !message) {
    throw new ApiError(400, "title and message are required");
  }

  const notification = await Notification.create({
    user: userId || null,
    targetRole: targetRole || null,
    title,
    message,
    type: type || "system",
    metadata: metadata || {},
  });

  res.status(201).json({
    success: true,
    message: "Notification created successfully",
    data: notification,
  });
});

module.exports = {
  getMyNotifications,
  markNotificationRead,
  createBroadcastNotification,
};
