const express = require("express");

const notificationController = require("../controllers/notification.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);
router.get("/", notificationController.getMyNotifications);
router.put("/:id/read", notificationController.markNotificationRead);

module.exports = router;
