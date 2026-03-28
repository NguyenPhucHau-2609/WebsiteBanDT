const express = require("express");

const orderController = require("../controllers/order.controller");
const { optionalAuth, protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", optionalAuth, orderController.createOrder);
router.get("/user", protect, orderController.getUserOrders);
router.put("/cancel/:id", protect, orderController.cancelOrder);
router.get("/:id", protect, orderController.getOrderById);

module.exports = router;
