const express = require("express");

const cartController = require("../controllers/cart.controller");
const { optionalAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(optionalAuth);
router.post("/", cartController.addToCart);
router.get("/", cartController.getCart);
router.put("/", cartController.updateCart);
router.delete("/", cartController.clearCart);
router.delete("/:itemId", cartController.removeCartItem);
router.get("/count", cartController.getCartCount);

module.exports = router;
