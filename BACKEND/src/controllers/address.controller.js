const Address = require("../models/address.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");

const createAddress = asyncHandler(async (req, res) => {
  const payload = { ...req.body, user: req.user._id };

  const currentCount = await Address.countDocuments({ user: req.user._id });
  if (currentCount === 0) {
    payload.isDefault = true;
  }

  if (payload.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const address = await Address.create(payload);

  res.status(201).json({
    success: true,
    message: "Address created successfully",
    data: address,
  });
});

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  res.json({
    success: true,
    data: addresses,
  });
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  Object.assign(address, req.body);
  await address.save();

  res.json({
    success: true,
    message: "Address updated successfully",
    data: address,
  });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  const defaultAddress = await Address.findOne({ user: req.user._id, isDefault: true });
  if (!defaultAddress) {
    const latestAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (latestAddress) {
      latestAddress.isDefault = true;
      await latestAddress.save();
    }
  }

  res.json({
    success: true,
    message: "Address deleted successfully",
  });
});

module.exports = {
  createAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
};
