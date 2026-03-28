const express = require("express");

const addressController = require("../controllers/address.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);
router.post("/", addressController.createAddress);
router.get("/", addressController.getAddresses);
router.put("/:id", addressController.updateAddress);
router.delete("/:id", addressController.deleteAddress);

module.exports = router;
