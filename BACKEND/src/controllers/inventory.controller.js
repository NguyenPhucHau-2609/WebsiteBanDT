const InventoryLog = require("../models/inventory-log.model");
const Variant = require("../models/variant.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");
const { adjustVariantStock } = require("../services/inventory.service");

const getInventoryOverview = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.lowStock === "true") {
    query.stock = { $lte: Number(req.query.threshold) || 5 };
  }

  const variants = await Variant.find(query)
    .populate("product", "name slug images")
    .sort({ stock: 1, createdAt: -1 });

  res.json({
    success: true,
    data: variants,
  });
});

const adjustStock = asyncHandler(async (req, res) => {
  const { quantityChange, note } = req.body;

  if (quantityChange === undefined) {
    throw new ApiError(400, "quantityChange is required");
  }

  const variant = await adjustVariantStock({
    variantId: req.params.variantId,
    quantityChange: Number(quantityChange),
    type: "manual_adjustment",
    note: note || "Manual stock adjustment",
    createdBy: req.user._id,
  });

  res.json({
    success: true,
    message: "Stock adjusted successfully",
    data: variant,
  });
});

const getInventoryLogs = asyncHandler(async (_req, res) => {
  const logs = await InventoryLog.find()
    .populate("product", "name")
    .populate("variant", "sku color storage")
    .populate("createdBy", "fullName role")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: logs,
  });
});

module.exports = {
  getInventoryOverview,
  adjustStock,
  getInventoryLogs,
};
