const Order = require("../models/order.model");
const ReturnRequest = require("../models/return-request.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");
const { adjustVariantStock } = require("../services/inventory.service");
const { createNotification } = require("../services/notification.service");
const { ORDER_STATUS } = require("../utils/order-status");

const createReturnRequest = asyncHandler(async (req, res) => {
  const { orderId, reason, description, images = [] } = req.body;

  if (!orderId || !reason) {
    throw new ApiError(400, "orderId and reason are required");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.user?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You cannot create a return request for this order");
  }

  if (order.status !== ORDER_STATUS.DELIVERED) {
    throw new ApiError(400, "Only delivered orders can create return requests");
  }

  const request = await ReturnRequest.create({
    order: order._id,
    user: req.user._id,
    reason,
    description,
    images,
  });

  order.status = ORDER_STATUS.RETURN_REQUESTED;
  order.timeline.push({
    status: ORDER_STATUS.RETURN_REQUESTED,
    message: "Khach hang yeu cau doi/tra hang",
    updatedBy: req.user._id,
  });
  await order.save();

  await createNotification({
    targetRole: "staff",
    title: "Yeu cau doi tra moi",
    message: `Don hang ${order.orderCode} vua co yeu cau doi/tra`,
    type: "order",
    metadata: { orderId: order._id, returnRequestId: request._id },
  });

  res.status(201).json({
    success: true,
    message: "Return request created successfully",
    data: request,
  });
});

const listReturnRequests = asyncHandler(async (req, res) => {
  const query = req.user.role === "customer" ? { user: req.user._id } : {};

  if (req.query.status) {
    query.status = req.query.status;
  }

  const requests = await ReturnRequest.find(query)
    .populate("user", "fullName email phone")
    .populate("order", "orderCode status total")
    .populate("handledBy", "fullName role")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: requests,
  });
});

const updateReturnRequest = asyncHandler(async (req, res) => {
  const request = await ReturnRequest.findById(req.params.id).populate("order");

  if (!request) {
    throw new ApiError(404, "Return request not found");
  }

  request.status = req.body.status || request.status;
  request.resolutionNote = req.body.resolutionNote || request.resolutionNote;
  request.handledBy = req.user._id;
  await request.save();

  const order = await Order.findById(request.order._id);

  if (request.status === "approved") {
    order.timeline.push({
      status: ORDER_STATUS.RETURN_REQUESTED,
      message: "Nhan vien da chap nhan yeu cau doi/tra",
      updatedBy: req.user._id,
    });
  }

  if (request.status === "completed") {
    order.status = ORDER_STATUS.RETURNED;
    order.timeline.push({
      status: ORDER_STATUS.RETURNED,
      message: "Don hang da duoc doi/tra thanh cong",
      updatedBy: req.user._id,
    });

    for (const item of order.items) {
      await adjustVariantStock({
        variantId: item.variant,
        quantityChange: item.quantity,
        type: "return_restocked",
        note: `Return completed for ${order.orderCode}`,
        createdBy: req.user._id,
      });
    }
  }

  if (request.status === "rejected") {
    order.status = ORDER_STATUS.DELIVERED;
  }

  await order.save();

  await createNotification({
    user: request.user,
    title: "Cap nhat yeu cau doi tra",
    message: `Yeu cau doi/tra cho don ${order.orderCode} dang o trang thai ${request.status}`,
    type: "order",
    metadata: { returnRequestId: request._id, orderId: order._id },
  });

  res.json({
    success: true,
    message: "Return request updated successfully",
    data: request,
  });
});

module.exports = {
  createReturnRequest,
  listReturnRequests,
  updateReturnRequest,
};
