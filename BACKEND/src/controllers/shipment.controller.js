const Order = require("../models/order.model");
const Shipment = require("../models/shipment.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");
const generateCode = require("../utils/generate-code");
const { ORDER_STATUS } = require("../utils/order-status");
const { createNotification } = require("../services/notification.service");

const createOrUpdateShipment = asyncHandler(async (req, res) => {
  const { orderId, carrier, trackingCode, estimatedDeliveryAt, note } = req.body;

  if (!orderId || !carrier) {
    throw new ApiError(400, "orderId and carrier are required");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  let shipment = await Shipment.findOne({ order: orderId });

  if (!shipment) {
    shipment = await Shipment.create({
      order: orderId,
      carrier,
      trackingCode: trackingCode || generateCode("SHIP-"),
      estimatedDeliveryAt,
      note,
      shippedAt: new Date(),
    });
  } else {
    shipment.carrier = carrier;
    shipment.trackingCode = trackingCode || shipment.trackingCode;
    shipment.estimatedDeliveryAt = estimatedDeliveryAt || shipment.estimatedDeliveryAt;
    shipment.note = note || shipment.note;
    await shipment.save();
  }

  order.status = ORDER_STATUS.SHIPPING;
  order.timeline.push({
    status: ORDER_STATUS.SHIPPING,
    message: `Don hang da ban giao cho don vi van chuyen ${shipment.carrier}`,
    updatedBy: req.user._id,
  });
  await order.save();

  if (order.user) {
    await createNotification({
      user: order.user,
      title: "Don hang dang giao",
      message: `Don ${order.orderCode} dang duoc van chuyen, ma theo doi ${shipment.trackingCode}`,
      type: "order",
      metadata: { orderId: order._id, shipmentId: shipment._id },
    });
  }

  res.status(201).json({
    success: true,
    message: "Shipment created or updated successfully",
    data: shipment,
  });
});

const updateShipmentStatus = asyncHandler(async (req, res) => {
  const shipment = await Shipment.findById(req.params.id);

  if (!shipment) {
    throw new ApiError(404, "Shipment not found");
  }

  shipment.status = req.body.status || shipment.status;

  if (shipment.status === "in_transit") {
    shipment.shippedAt = shipment.shippedAt || new Date();
  }

  if (shipment.status === "delivered") {
    shipment.deliveredAt = new Date();
  }

  if (req.body.note) {
    shipment.note = req.body.note;
  }

  await shipment.save();

  const order = await Order.findById(shipment.order);
  if (shipment.status === "delivered") {
    order.status = ORDER_STATUS.DELIVERED;
    order.deliveredAt = new Date();
  } else if (shipment.status === "in_transit") {
    order.status = ORDER_STATUS.SHIPPING;
  }

  order.timeline.push({
    status: order.status,
    message: `Cap nhat giao hang: ${shipment.status}`,
    updatedBy: req.user._id,
  });
  await order.save();

  if (order.user) {
    await createNotification({
      user: order.user,
      title: "Cap nhat giao hang",
      message: `Don ${order.orderCode} co trang thai giao hang ${shipment.status}`,
      type: "order",
      metadata: { orderId: order._id, shipmentId: shipment._id },
    });
  }

  res.json({
    success: true,
    message: "Shipment updated successfully",
    data: shipment,
  });
});

const getShipmentByTrackingCode = asyncHandler(async (req, res) => {
  const shipment = await Shipment.findOne({ trackingCode: req.params.trackingCode }).populate(
    "order",
    "orderCode status paymentStatus total"
  );

  if (!shipment) {
    throw new ApiError(404, "Shipment not found");
  }

  res.json({
    success: true,
    data: shipment,
  });
});

module.exports = {
  createOrUpdateShipment,
  updateShipmentStatus,
  getShipmentByTrackingCode,
};
