const crypto = require("crypto");

const User = require("../models/user.model");
const ApiError = require("../utils/api-error");
const asyncHandler = require("../utils/async-handler");
const { buildAuthResponse } = require("../services/token.service");

const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !password || (!email && !phone)) {
    throw new ApiError(400, "fullName, password and email or phone are required");
  }

  const duplicateConditions = [];
  if (email) duplicateConditions.push({ email: email.toLowerCase() });
  if (phone) duplicateConditions.push({ phone });

  const existingUser = await User.findOne({ $or: duplicateConditions });
  if (existingUser) {
    throw new ApiError(409, "Email or phone already exists");
  }

  const user = await User.create({
    fullName,
    email: email ? email.toLowerCase() : undefined,
    phone,
    password,
    role: "customer",
  });

  res.status(201).json({
    success: true,
    message: "Register successfully",
    data: buildAuthResponse(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, phone, emailOrPhone, password } = req.body;

  if ((!email && !phone && !emailOrPhone) || !password) {
    throw new ApiError(400, "emailOrPhone and password are required");
  }

  const user = await User.findOne({
    $or: [
      { email: (email || emailOrPhone || "").toLowerCase() },
      { phone: phone || emailOrPhone },
    ],
  }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.json({
    success: true,
    message: "Login successfully",
    data: buildAuthResponse(user),
  });
});

const socialLogin = asyncHandler(async (req, res) => {
  const { provider, providerId, email, fullName, phone } = req.body;

  if (!provider || !providerId || !fullName || (!email && !phone)) {
    throw new ApiError(400, "provider, providerId, fullName and email or phone are required");
  }

  if (!["google", "facebook"].includes(provider)) {
    throw new ApiError(400, "Unsupported social provider");
  }

  const conditions = [];
  if (email) conditions.push({ email: email.toLowerCase() });
  if (phone) conditions.push({ phone });
  conditions.push({ [`socialProviders.${provider}Id`]: providerId });

  let user = await User.findOne({ $or: conditions });

  if (!user) {
    user = await User.create({
      fullName,
      email: email ? email.toLowerCase() : undefined,
      phone,
      socialProviders: {
        [`${provider}Id`]: providerId,
      },
    });
  } else {
    user.socialProviders = {
      ...user.socialProviders,
      [`${provider}Id`]: providerId,
    };
    await user.save();
  }

  res.json({
    success: true,
    message: "Social login successfully",
    data: buildAuthResponse(user),
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email, phone } = req.body;
  const exposeResetTokenForTesting =
    process.env.EXPOSE_RESET_TOKEN_FOR_TESTING === "true" &&
    process.env.NODE_ENV !== "production";

  if (!email && !phone) {
    throw new ApiError(400, "email or phone is required");
  }

  const conditions = [];
  if (email) conditions.push({ email: email.toLowerCase() });
  if (phone) conditions.push({ phone });

  const user = await User.findOne({ $or: conditions }).select(
    "+passwordResetToken +passwordResetExpires"
  );

  let debugData;

  if (user) {
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    if (exposeResetTokenForTesting) {
      debugData = {
        resetToken,
        expiresAt: user.passwordResetExpires,
      };
    }
  }

  res.json({
    success: true,
    message: "If the account exists, password reset instructions have been generated",
    ...(debugData ? { data: debugData } : {}),
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ApiError(400, "token and newPassword are required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new ApiError(400, "Reset token is invalid or expired");
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: "Password reset successfully",
    data: buildAuthResponse(user),
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "currentPassword and newPassword are required");
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: "Password changed successfully",
  });
});

module.exports = {
  register,
  login,
  socialLogin,
  forgotPassword,
  resetPassword,
  changePassword,
};
