const express = require("express");

const voucherController = require("../controllers/voucher.controller");
const { optionalAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/apply", optionalAuth, voucherController.applyVoucher);

module.exports = router;
