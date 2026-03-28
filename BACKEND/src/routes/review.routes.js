const express = require("express");

const reviewController = require("../controllers/review.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, reviewController.createReview);
router.get("/:productId", reviewController.getReviewsByProduct);

module.exports = router;
