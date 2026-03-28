const express = require("express");

const promotionController = require("../controllers/promotion.controller");

const router = express.Router();

router.get("/", promotionController.getActivePromotions);

module.exports = router;
