const Order = require("../models/order.model");
const Payment = require("../models/payment.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");
const generateCode = require("../utils/generate-code");
const { PAYMENT_STATUS } = require("../utils/order-status");
const { createNotification } = require("../services/notification.service");

const createPayment = asyncHandler(async (req, res) => {
  const { orderId, provider, simulateSuccess = true, metadata = {} } = req.body;

  if (!orderId || !provider) {
    throw new ApiError(400, "orderId and provider are required");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (
    req.user &&
    req.user.role === "customer" &&
    (!order.user || order.user.toString() !== req.user._id.toString())
  ) {
    throw new ApiError(403, "You cannot pay for this order");
  }

  if (!req.user) {
    if (order.user) {
      throw new ApiError(401, "Authentication is required for this order");
    }

    const guestEmail = req.body.guestEmail?.toLowerCase();
    const guestPhone = req.body.guestPhone;

    const matchedGuest =
      (guestEmail && order.guestInfo?.email?.toLowerCase() === guestEmail) ||
      (guestPhone && order.guestInfo?.phone === guestPhone);

    if (!matchedGuest) {
      throw new ApiError(403, "Guest verification failed");
    }
  }

  const transactionCode = provider === "cod" ? null : generateCode("PAY-");
  const status = provider === "cod" ? PAYMENT_STATUS.PENDING : simulateSuccess ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED;

  const payment = await Payment.create({
    order: order._id,
    provider,
    transactionCode,
    amount: order.total,
    status,
    paidAt: status === PAYMENT_STATUS.PAID ? new Date() : null,
    metadata: {
      payUrl:
        provider === "cod"
          ? null
          : `${process.env.CLIENT_URL || "http://localhost:3000"}/payment/${transactionCode}`,
      ...metadata,
    },
  });

  order.paymentMethod = provider;
  order.paymentStatus = status;
  order.timeline.push({
    status: order.status,
    message:
      status === PAYMENT_STATUS.PAID
        ? `Thanh toan ${provider} thanh cong`
        : provider === "cod"
          ? "Thanh toan COD se duoc thu khi giao hang"
          : `Thanh toan ${provider} that bai`,
    updatedBy: req.user?._id || null,
  });
  await order.save();

  if (order.user) {
    await createNotification({
      user: order.user,
      title: "Cap nhat thanh toan",
      message: `Thanh toan cho don ${order.orderCode} dang o trang thai ${status}`,
      type: "order",
      metadata: { orderId: order._id, paymentId: payment._id },
    });
  }

  res.status(201).json({
    success: true,
    message: "Payment processed successfully",
    data: {
      payment,
      order,
    },
  });
});

module.exports = {
  createPayment,
};
