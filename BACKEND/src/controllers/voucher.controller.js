const Voucher = require("../models/voucher.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");
const { getOrCreateCart, hydrateCart } = require("../services/cart.service");
const { applyVoucherDiscount } = require("../utils/pricing");

const applyVoucher = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw new ApiError(400, "Voucher code is required");
  }

  const voucher = await Voucher.findOne({ code: code.toUpperCase() });
  if (!voucher) {
    throw new ApiError(404, "Voucher not found");
  }

  const { cart } = await getOrCreateCart(req);
  const hydratedCart = await hydrateCart(cart);

  applyVoucherDiscount({
    subtotal: hydratedCart.totals.subtotal,
    voucher,
  });

  cart.appliedVoucherCode = voucher.code;
  await cart.save();

  res.json({
    success: true,
    message: "Voucher applied successfully",
    data: await hydrateCart(cart),
  });
});

const getVouchers = asyncHandler(async (_req, res) => {
  const vouchers = await Voucher.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    data: vouchers,
  });
});

const createVoucher = asyncHandler(async (req, res) => {
  const code = req.body.code?.trim().toUpperCase();

  if (!code) {
    throw new ApiError(400, "Voucher code is required");
  }

  const voucher = await Voucher.create({
    ...req.body,
    code,
  });

  res.status(201).json({
    success: true,
    message: "Voucher created successfully",
    data: voucher,
  });
});

const updateVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);

  if (!voucher) {
    throw new ApiError(404, "Voucher not found");
  }

  Object.assign(voucher, req.body);
  if (req.body.code) {
    voucher.code = req.body.code.toUpperCase();
  }
  await voucher.save();

  res.json({
    success: true,
    message: "Voucher updated successfully",
    data: voucher,
  });
});

const deleteVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findByIdAndDelete(req.params.id);

  if (!voucher) {
    throw new ApiError(404, "Voucher not found");
  }

  res.json({
    success: true,
    message: "Voucher deleted successfully",
  });
});

module.exports = {
  applyVoucher,
  getVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
};
