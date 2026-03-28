const Order = require("../models/order.model");
const Product = require("../models/product.model");
const Review = require("../models/review.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");

const refreshProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    {
      $group: {
        _id: "$product",
        ratingAverage: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const update = stats[0] || { ratingAverage: 0, ratingCount: 0 };

  await Product.findByIdAndUpdate(productId, {
    ratingAverage: Number((update.ratingAverage || 0).toFixed(1)),
    ratingCount: update.ratingCount || 0,
  });
};

const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment, images = [] } = req.body;

  if (!productId || !rating) {
    throw new ApiError(400, "productId and rating are required");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const hasPurchased = await Order.findOne({
    user: req.user._id,
    status: "delivered",
    "items.product": productId,
  });

  if (!hasPurchased) {
    throw new ApiError(400, "You can only review delivered products you purchased");
  }

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    title,
    comment,
    images,
  });

  await refreshProductRating(product._id);

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    data: review,
  });
});

const getReviewsByProduct = asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    product: req.params.productId,
    isApproved: true,
  })
    .populate("user", "fullName avatar")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: reviews,
  });
});

const getAllReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.find()
    .populate("user", "fullName email")
    .populate("product", "name slug")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: reviews,
  });
});

const updateReviewApproval = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  review.isApproved = req.body.isApproved ?? review.isApproved;
  await review.save();
  await refreshProductRating(review.product);

  res.json({
    success: true,
    message: "Review updated successfully",
    data: review,
  });
});

module.exports = {
  createReview,
  getReviewsByProduct,
  getAllReviews,
  updateReviewApproval,
};
