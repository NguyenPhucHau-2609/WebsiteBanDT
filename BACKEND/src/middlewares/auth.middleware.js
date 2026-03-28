const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const ApiError = require("../utils/api-error");
const asyncHandler = require("../utils/async-handler");

const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }

  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    throw new ApiError(401, "User account is unavailable");
  }

  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (_error) {
    req.user = null;
  }

  next();
});

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication is required"));
  }

  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to access this resource"));
  }

  next();
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
};
