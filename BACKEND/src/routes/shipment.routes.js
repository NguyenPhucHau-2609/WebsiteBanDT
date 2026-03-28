const express = require("express");

const shipmentController = require("../controllers/shipment.controller");

const router = express.Router();

router.get("/:trackingCode", shipmentController.getShipmentByTrackingCode);

module.exports = router;
