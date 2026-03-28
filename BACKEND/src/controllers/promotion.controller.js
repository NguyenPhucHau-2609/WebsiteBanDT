const Promotion = require("../models/promotion.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");

const getActivePromotions = asyncHandler(async (_req, res) => {
  const now = new Date();
  const promotions = await Promotion.find({
    isActive: true,
    startAt: { $lte: now },
    endAt: { $gte: now },
  })
    .populate("productIds", "name slug")
    .populate("categoryIds", "name slug")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: promotions,
  });
});

const getPromotions = asyncHandler(async (_req, res) => {
  const promotions = await Promotion.find()
    .populate("productIds", "name slug")
    .populate("categoryIds", "name slug")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: promotions,
  });
});

const createPromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.create(req.body);

  res.status(201).json({
    success: true,
    message: "Promotion created successfully",
    data: promotion,
  });
});

const updatePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new ApiError(404, "Promotion not found");
  }

  Object.assign(promotion, req.body);
  await promotion.save();

  res.json({
    success: true,
    message: "Promotion updated successfully",
    data: promotion,
  });
});

const deletePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findByIdAndDelete(req.params.id);

  if (!promotion) {
    throw new ApiError(404, "Promotion not found");
  }

  res.json({
    success: true,
    message: "Promotion deleted successfully",
  });
});

module.exports = {
  getActivePromotions,
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
};
