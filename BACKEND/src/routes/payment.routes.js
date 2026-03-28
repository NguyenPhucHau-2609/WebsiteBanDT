const express = require("express");

const paymentController = require("../controllers/payment.controller");
const { optionalAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", optionalAuth, paymentController.createPayment);

module.exports = router;
