const express = require("express");

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const addressRoutes = require("./address.routes");
const catalogRoutes = require("./catalog.routes");
const productRoutes = require("./product.routes");
const reviewRoutes = require("./review.routes");
const cartRoutes = require("./cart.routes");
const voucherRoutes = require("./voucher.routes");
const promotionRoutes = require("./promotion.routes");
const orderRoutes = require("./order.routes");
const paymentRoutes = require("./payment.routes");
const notificationRoutes = require("./notification.routes");
const supportRoutes = require("./support.routes");
const returnRoutes = require("./return.routes");
const shipmentRoutes = require("./shipment.routes");
const adminRoutes = require("./admin.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/address", addressRoutes);
router.use(catalogRoutes);
router.use("/products", productRoutes);
router.use("/reviews", reviewRoutes);
router.use("/cart", cartRoutes);
router.use("/voucher", voucherRoutes);
router.use("/promotions", promotionRoutes);
router.use("/orders", orderRoutes);
router.use("/payment", paymentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/support", supportRoutes);
router.use("/returns", returnRoutes);
router.use("/shipments", shipmentRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
