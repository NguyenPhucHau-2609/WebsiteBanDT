const mongoose = require("mongoose");

const Product = require("../models/product.model");
const Variant = require("../models/variant.model");
const Brand = require("../models/brand.model");
const Category = require("../models/category.model");
const Review = require("../models/review.model");
const Promotion = require("../models/promotion.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");
const slugify = require("../utils/slugify");
const getPagination = require("../utils/pagination");

const applyVariantFilters = async (queryParams) => {
  const variantFilter = { isActive: true };

  if (queryParams.color) {
    variantFilter.color = { $regex: queryParams.color, $options: "i" };
  }

  if (queryParams.storage) {
    variantFilter.storage = { $regex: queryParams.storage, $options: "i" };
  }

  if (queryParams.minPrice || queryParams.maxPrice) {
    variantFilter.price = {};
    if (queryParams.minPrice) variantFilter.price.$gte = Number(queryParams.minPrice);
    if (queryParams.maxPrice) variantFilter.price.$lte = Number(queryParams.maxPrice);
  }

  if (Object.keys(variantFilter).length === 1) {
    return null;
  }

  const variants = await Variant.find(variantFilter).select("product");
  return [...new Set(variants.map((variant) => variant.product.toString()))];
};

const getProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const query = {};

  if (req.query.includeInactive !== "true") {
    query.isActive = true;
  }

  if (req.query.q) {
    query.$or = [
      { name: { $regex: req.query.q, $options: "i" } },
      { shortDescription: { $regex: req.query.q, $options: "i" } },
      { description: { $regex: req.query.q, $options: "i" } },
    ];
  }

  if (req.query.brand) {
    const brandConditions = [{ slug: req.query.brand }];
    if (mongoose.Types.ObjectId.isValid(req.query.brand)) {
      brandConditions.unshift({ _id: req.query.brand });
    }

    const brand = await Brand.findOne({
      $or: brandConditions,
    }).select("_id");

    query.brand = brand ? brand._id : null;
  }

  if (req.query.category) {
    const categoryConditions = [{ slug: req.query.category }];
    if (mongoose.Types.ObjectId.isValid(req.query.category)) {
      categoryConditions.unshift({ _id: req.query.category });
    }

    const category = await Category.findOne({
      $or: categoryConditions,
    }).select("_id");

    query.category = category ? category._id : null;
  }

  if (req.query.isFeatured !== undefined) {
    query.isFeatured = req.query.isFeatured === "true";
  }

  const matchedProductIds = await applyVariantFilters(req.query);
  if (matchedProductIds) {
    query._id = { $in: matchedProductIds };
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    price_asc: { createdAt: -1 },
    price_desc: { createdAt: -1 },
    best_selling: { soldCount: -1, createdAt: -1 },
    rating: { ratingAverage: -1, createdAt: -1 },
  };

  const sort = sortOptions[req.query.sort] || sortOptions.newest;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("brand", "name slug")
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  const productIds = products.map((product) => product._id);
  const variants = await Variant.find({
    product: { $in: productIds },
    isActive: true,
  }).sort({ price: 1 });

  const variantMap = variants.reduce((acc, variant) => {
    const key = variant.product.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(variant);
    return acc;
  }, {});

  const data = products.map((product) => {
    const productVariants = variantMap[product._id.toString()] || [];
    const prices = productVariants.map((variant) => variant.price);
    const totalStock = productVariants.reduce((sum, variant) => sum + variant.stock, 0);

    return {
      ...product.toObject(),
      variants: productVariants,
      priceRange: prices.length
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : { min: 0, max: 0 },
      totalStock,
    };
  });

  if (req.query.sort === "price_asc") {
    data.sort((a, b) => a.priceRange.min - b.priceRange.min);
  }

  if (req.query.sort === "price_desc") {
    data.sort((a, b) => b.priceRange.max - a.priceRange.max);
  }

  res.json({
    success: true,
    data: {
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

const getProductSuggestions = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim();

  if (!q) {
    return res.json({ success: true, data: [] });
  }

  const products = await Product.find({
    isActive: true,
    name: { $regex: q, $options: "i" },
  })
    .select("name slug images")
    .limit(10);

  res.json({
    success: true,
    data: products,
  });
});

const getProductDetail = asyncHandler(async (req, res) => {
  const conditions = [{ slug: req.params.id }];
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    conditions.unshift({ _id: req.params.id });
  }

  const product = await Product.findOne({
    $or: conditions,
  })
    .populate("brand", "name slug")
    .populate("category", "name slug");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const [variants, reviews, promotions] = await Promise.all([
    Variant.find({ product: product._id, isActive: true }).sort({ price: 1 }),
    Review.find({ product: product._id, isApproved: true })
      .populate("user", "fullName avatar")
      .sort({ createdAt: -1 }),
    Promotion.find({
      isActive: true,
      startAt: { $lte: new Date() },
      endAt: { $gte: new Date() },
      $or: [{ productIds: product._id }, { categoryIds: product.category?._id }],
    }),
  ]);

  product.viewCount += 1;
  await product.save();

  res.json({
    success: true,
    data: {
      ...product.toObject(),
      variants,
      reviews,
      promotions,
    },
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) {
    throw new ApiError(400, "Product name is required");
  }

  const product = await Product.create({
    ...req.body,
    name,
    slug: req.body.slug || slugify(name),
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (req.body.name) {
    product.name = req.body.name;
    product.slug = req.body.slug || slugify(req.body.name);
  }

  [
    "skuBase",
    "shortDescription",
    "description",
    "brand",
    "category",
    "images",
    "specs",
    "tags",
    "isFeatured",
    "isActive",
  ].forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();

  res.json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  await Variant.deleteMany({ product: product._id });

  res.json({
    success: true,
    message: "Product deleted successfully",
  });
});

const addVariant = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const variant = await Variant.create({
    ...req.body,
    product: product._id,
  });

  res.status(201).json({
    success: true,
    message: "Variant created successfully",
    data: variant,
  });
});

const updateVariant = asyncHandler(async (req, res) => {
  const variant = await Variant.findById(req.params.id);

  if (!variant) {
    throw new ApiError(404, "Variant not found");
  }

  Object.assign(variant, req.body);
  await variant.save();

  res.json({
    success: true,
    message: "Variant updated successfully",
    data: variant,
  });
});

const deleteVariant = asyncHandler(async (req, res) => {
  const variant = await Variant.findByIdAndDelete(req.params.id);

  if (!variant) {
    throw new ApiError(404, "Variant not found");
  }

  res.json({
    success: true,
    message: "Variant deleted successfully",
  });
});

module.exports = {
  getProducts,
  getProductSuggestions,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant,
};
