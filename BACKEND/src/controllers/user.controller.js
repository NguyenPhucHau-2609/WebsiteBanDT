const User = require("../models/user.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");
const getPagination = require("../utils/pagination");

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["fullName", "email", "phone", "avatar", "dateOfBirth", "gender"];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  await req.user.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: req.user,
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const query = {};

  if (req.query.role) {
    query.role = req.query.role;
  }

  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === "true";
  }

  if (req.query.keyword) {
    query.$or = [
      { fullName: { $regex: req.query.keyword, $options: "i" } },
      { email: { $regex: req.query.keyword, $options: "i" } },
      { phone: { $regex: req.query.keyword, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      items: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

const getUserDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({
    success: true,
    data: user,
  });
});

const updateUserByAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const allowedFields = ["fullName", "email", "phone", "role", "isActive", "avatar"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save();

  res.json({
    success: true,
    message: "User updated successfully",
    data: user,
  });
});

module.exports = {
  getProfile,
  updateProfile,
  listUsers,
  getUserDetail,
  updateUserByAdmin,
};
