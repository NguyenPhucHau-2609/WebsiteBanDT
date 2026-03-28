const Brand = require("../models/brand.model");
const Category = require("../models/category.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");
const slugify = require("../utils/slugify");

const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).populate("parent", "name slug");

  res.json({
    success: true,
    data: categories,
  });
});

const createCategory = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const category = await Category.create({
    ...req.body,
    name,
    slug: req.body.slug || slugify(name),
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (req.body.name) {
    category.name = req.body.name;
    category.slug = req.body.slug || slugify(req.body.name);
  }

  ["description", "parent", "isActive"].forEach((field) => {
    if (req.body[field] !== undefined) {
      category[field] = req.body[field];
    }
  });

  await category.save();

  res.json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  res.json({
    success: true,
    message: "Category deleted successfully",
  });
});

const getBrands = asyncHandler(async (_req, res) => {
  const brands = await Brand.find({ isActive: true });

  res.json({
    success: true,
    data: brands,
  });
});

const createBrand = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();

  if (!name) {
    throw new ApiError(400, "Brand name is required");
  }

  const brand = await Brand.create({
    ...req.body,
    name,
    slug: req.body.slug || slugify(name),
  });

  res.status(201).json({
    success: true,
    message: "Brand created successfully",
    data: brand,
  });
});

const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    throw new ApiError(404, "Brand not found");
  }

  if (req.body.name) {
    brand.name = req.body.name;
    brand.slug = req.body.slug || slugify(req.body.name);
  }

  ["description", "logo", "isActive"].forEach((field) => {
    if (req.body[field] !== undefined) {
      brand[field] = req.body[field];
    }
  });

  await brand.save();

  res.json({
    success: true,
    message: "Brand updated successfully",
    data: brand,
  });
});

const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);

  if (!brand) {
    throw new ApiError(404, "Brand not found");
  }

  res.json({
    success: true,
    message: "Brand deleted successfully",
  });
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
};
