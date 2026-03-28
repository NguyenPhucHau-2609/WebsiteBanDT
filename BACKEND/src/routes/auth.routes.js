const express = require("express");

const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/social-login", authController.socialLogin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.put("/change-password", protect, authController.changePassword);

module.exports = router;
