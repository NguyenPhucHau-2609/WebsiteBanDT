const express = require("express");

const catalogController = require("../controllers/catalog.controller");
const productController = require("../controllers/product.controller");
const reviewController = require("../controllers/review.controller");
const voucherController = require("../controllers/voucher.controller");
const promotionController = require("../controllers/promotion.controller");
const orderController = require("../controllers/order.controller");
const notificationController = require("../controllers/notification.controller");
const supportController = require("../controllers/support.controller");
const returnController = require("../controllers/return.controller");
const shipmentController = require("../controllers/shipment.controller");
const inventoryController = require("../controllers/inventory.controller");
const analyticsController = require("../controllers/analytics.controller");
const userController = require("../controllers/user.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/users", authorize("admin"), userController.listUsers);
router.get("/users/:id", authorize("admin"), userController.getUserDetail);
router.put("/users/:id", authorize("admin"), userController.updateUserByAdmin);

router.post("/categories", authorize("admin"), catalogController.createCategory);
router.put("/categories/:id", authorize("admin"), catalogController.updateCategory);
router.delete("/categories/:id", authorize("admin"), catalogController.deleteCategory);

router.post("/brands", authorize("admin"), catalogController.createBrand);
router.put("/brands/:id", authorize("admin"), catalogController.updateBrand);
router.delete("/brands/:id", authorize("admin"), catalogController.deleteBrand);

router.post("/products", authorize("admin"), productController.createProduct);
router.put("/products/:id", authorize("admin"), productController.updateProduct);
router.delete("/products/:id", authorize("admin"), productController.deleteProduct);
router.post("/products/:productId/variants", authorize("admin"), productController.addVariant);
router.put("/variants/:id", authorize("admin"), productController.updateVariant);
router.delete("/variants/:id", authorize("admin"), productController.deleteVariant);

router.get("/reviews", authorize("admin", "staff"), reviewController.getAllReviews);
router.put("/reviews/:id", authorize("admin", "staff"), reviewController.updateReviewApproval);

router.get("/vouchers", authorize("admin"), voucherController.getVouchers);
router.post("/vouchers", authorize("admin"), voucherController.createVoucher);
router.put("/vouchers/:id", authorize("admin"), voucherController.updateVoucher);
router.delete("/vouchers/:id", authorize("admin"), voucherController.deleteVoucher);

router.get("/promotions", authorize("admin"), promotionController.getPromotions);
router.post("/promotions", authorize("admin"), promotionController.createPromotion);
router.put("/promotions/:id", authorize("admin"), promotionController.updatePromotion);
router.delete("/promotions/:id", authorize("admin"), promotionController.deletePromotion);

router.get("/orders", authorize("admin", "staff"), orderController.listOrdersAdmin);
router.put("/orders/:id/confirm", authorize("admin", "staff"), orderController.confirmOrder);
router.put("/orders/:id/status", authorize("admin", "staff"), orderController.updateOrderStatus);

router.post("/notifications", authorize("admin"), notificationController.createBroadcastNotification);

router.get("/support", authorize("admin", "staff"), supportController.listSupportTickets);
router.post("/support/:id/replies", authorize("admin", "staff"), supportController.replySupportTicket);
router.put("/support/:id/status", authorize("admin", "staff"), supportController.updateSupportTicketStatus);

router.get("/returns", authorize("admin", "staff"), returnController.listReturnRequests);
router.put("/returns/:id", authorize("admin", "staff"), returnController.updateReturnRequest);

router.post("/shipments", authorize("admin", "staff"), shipmentController.createOrUpdateShipment);
router.put("/shipments/:id/status", authorize("admin", "staff"), shipmentController.updateShipmentStatus);

router.get("/inventory", authorize("admin", "staff"), inventoryController.getInventoryOverview);
router.put("/inventory/variants/:variantId/adjust", authorize("admin", "staff"), inventoryController.adjustStock);
router.get("/inventory/logs", authorize("admin", "staff"), inventoryController.getInventoryLogs);

router.get("/analytics/overview", authorize("admin"), analyticsController.getOverview);

module.exports = router;
