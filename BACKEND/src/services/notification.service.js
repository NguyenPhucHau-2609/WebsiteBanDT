const Notification = require("../models/notification.model");

const createNotification = async ({
  user = null,
  targetRole = null,
  title,
  message,
  type = "system",
  metadata = {},
}) =>
  Notification.create({
    user,
    targetRole,
    title,
    message,
    type,
    metadata,
  });

module.exports = {
  createNotification,
};
