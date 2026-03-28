const jwt = require("jsonwebtoken");

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const buildAuthResponse = (user) => ({
  token: signToken(user._id),
  user: {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    isActive: user.isActive,
  },
});

module.exports = {
  signToken,
  buildAuthResponse,
};
