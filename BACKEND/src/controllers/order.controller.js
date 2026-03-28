const Address = require("../models/address.model");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const Variant = require("../models/variant.model");
const Voucher = require("../models/voucher.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");
const generateCode = require("../utils/generate-code");
const { calculateTotals } = require("../utils/pricing");
const { ORDER_STATUS, PAYMENT_STATUS } = require("../utils/order-status");
const { adjustVariantStock } = require("../services/inventory.service");
const { createNotification } = require("../services/notification.service");

const buildShippingAddress = async (req) => {
  if (req.body.shippingAddress) {
    return req.body.shippingAddress;
  }

  if (req.body.addressId && req.user) {
    const address = await Address.findOne({ _id: req.body.addressId, user: req.user._id });
    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    return {
      fullName: address.fullName,
      phone: address.phone,
      province: address.province,
      district: address.district,
      ward: address.ward,
      street: address.street,
      note: address.note,
    };
  }

  throw new ApiError(400, "shippingAddress or addressId is required");
};

const buildOrderItems = async (req) => {
  if (Array.isArray(req.body.items) && req.body.items.length > 0) {
    const orderItems = [];

    for (const inputItem of req.body.items) {
      const variant = await Variant.findById(inputItem.variantId).populate("product");
      if (!variant || !variant.isActive) {
        throw new ApiError(404, "Variant not found or inactive");
      }

      const product = await Product.findById(variant.product._id);
      if (!product || !product.isActive) {
        throw new ApiError(404, "Product not found or inactive");
      }

      if (variant.stock < inputItem.quantity) {
        throw new ApiError(400, `Insufficient stock for SKU ${variant.sku}`);
      }

      orderItems.push({
        product: product._id,
        variant: variant._id,
        productName: product.name,
        variantName: `${variant.color} - ${variant.storage}`,
        sku: variant.sku,
        image: variant.images?.[0] || product.images?.[0] || null,
        quantity: Number(inputItem.quantity),
        unitPrice: variant.price,
        lineTotal: variant.price * Number(inputItem.quantity),
      });
    }

    return { orderItems, cart: null };
  }

  const cartFilter = req.user
    ? { user: req.user._id }
    : {
        guestId: req.headers["x-guest-id"] || req.body.guestId || req.query.guestId,
        user: null,
      };

  const cart = await Cart.findOne(cartFilter).populate("items.product items.variant");

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const orderItems = [];

  for (const cartItem of cart.items) {
    const product = cartItem.product;
    const variant = cartItem.variant;

    if (!product || !product.isActive || !variant || !variant.isActive) {
      throw new ApiError(400, "Cart contains invalid products or variants");
    }

    if (variant.stock < cartItem.quantity) {
      throw new ApiError(400, `Insufficient stock for SKU ${variant.sku}`);
    }

    orderItems.push({
      product: product._id,
      variant: variant._id,
      productName: product.name,
      variantName: `${variant.color} - ${variant.storage}`,
      sku: variant.sku,
      image: variant.images?.[0] || product.images?.[0] || null,
      quantity: cartItem.quantity,
      unitPrice: variant.price,
      lineTotal: variant.price * cartItem.quantity,
    });
  }

  return { orderItems, cart };
};

const createOrder = asyncHandler(async (req, res) => {
  const shippingAddress = await buildShippingAddress(req);
  const { orderItems, cart } = await buildOrderItems(req);

  let voucher = null;
  const voucherCode = req.body.voucherCode || cart?.appliedVoucherCode;
  if (voucherCode) {
    voucher = await Voucher.findOne({ code: voucherCode.toUpperCase() });
  }

  const totals = calculateTotals({
    items: orderItems.map((item) => ({
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
    shippingFee: Number(req.body.shippingFee) || 0,
    voucher,
  });

  const order = await Order.create({
    orderCode: generateCode("ODR-"),
    user: req.user?._id || null,
    guestInfo: req.user
      ? undefined
      : {
          fullName: req.body.guestInfo?.fullName || shippingAddress.fullName,
          email: req.body.guestInfo?.email || null,
          phone: req.body.guestInfo?.phone || shippingAddress.phone,
        },
    items: orderItems,
    shippingAddress,
    note: req.body.note,
    paymentMethod: req.body.paymentMethod || "cod",
    paymentStatus: req.body.paymentMethod === "cod" ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PENDING,
    voucherCode: totals.voucherCode,
    subtotal: totals.subtotal,
    discount: totals.discount,
    shippingFee: totals.shippingFee,
    total: totals.total,
    timeline: [
      {
        status: ORDER_STATUS.PENDING,
        message: "Don hang da duoc tao",
        updatedBy: req.user?._id || null,
      },
    ],
  });

  for (const item of orderItems) {
    await adjustVariantStock({
      variantId: item.variant,
      quantityChange: -item.quantity,
      type: "order_deducted",
      note: `Order ${order.orderCode}`,
      createdBy: req.user?._id || null,
    });
  }

  if (voucher) {
    voucher.usedCount += 1;
    await voucher.save();
  }

  if (cart) {
    cart.items = [];
    cart.appliedVoucherCode = null;
    await cart.save();
  }

  if (req.user) {
    await createNotification({
      user: req.user._id,
      title: "Dat hang thanh cong",
      message: `Don hang ${order.orderCode} da duoc tao`,
      type: "order",
      metadata: { orderId: order._id, orderCode: order.orderCode },
    });
  }

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: order,
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "fullName email phone")
    .populate("confirmedBy", "fullName role")
    .populate("handledBy", "fullName role");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (
    req.user &&
    req.user.role === "customer" &&
    (!order.user || order.user._id.toString() !== req.user._id.toString())
  ) {
    throw new ApiError(403, "You cannot access this order");
  }

  res.json({
    success: true,
    data: order,
  });
});

const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: orders,
  });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.user?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You cannot cancel this order");
  }

  if (![ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(order.status)) {
    throw new ApiError(400, "Only pending or confirmed orders can be canceled");
  }

  order.status = ORDER_STATUS.CANCELED;
  order.canceledAt = new Date();
  order.timeline.push({
    status: ORDER_STATUS.CANCELED,
    message: req.body.reason || "Khach hang huy don",
    updatedBy: req.user._id,
  });
  await order.save();

  for (const item of order.items) {
    await adjustVariantStock({
      variantId: item.variant,
      quantityChange: item.quantity,
      type: "order_restocked",
      note: `Cancel order ${order.orderCode}`,
      createdBy: req.user._id,
    });
  }

  await createNotification({
    targetRole: "staff",
    title: "Don hang da bi huy",
    message: `Don hang ${order.orderCode} vua duoc khach hang huy`,
    type: "order",
    metadata: { orderId: order._id },
  });

  res.json({
    success: true,
    message: "Order canceled successfully",
    data: order,
  });
});

const listOrdersAdmin = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.paymentStatus) {
    query.paymentStatus = req.query.paymentStatus;
  }

  const orders = await Order.find(query)
    .populate("user", "fullName email phone")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: orders,
  });
});

const confirmOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throw new ApiError(400, "Only pending orders can be confirmed");
  }

  order.status = ORDER_STATUS.CONFIRMED;
  order.confirmedBy = req.user._id;
  order.handledBy = req.user._id;
  order.timeline.push({
    status: ORDER_STATUS.CONFIRMED,
    message: "Don hang da duoc xac nhan",
    updatedBy: req.user._id,
  });
  await order.save();

  if (order.user) {
    await createNotification({
      user: order.user,
      title: "Don hang da duoc xac nhan",
      message: `Don hang ${order.orderCode} da duoc nhan vien xac nhan`,
      type: "order",
      metadata: { orderId: order._id },
    });
  }

  res.json({
    success: true,
    message: "Order confirmed successfully",
    data: order,
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, message } = req.body;

  if (!status) {
    throw new ApiError(400, "status is required");
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.status = status;
  order.handledBy = req.user._id;
  if (status === ORDER_STATUS.DELIVERED) {
    order.deliveredAt = new Date();
  }

  order.timeline.push({
    status,
    message: message || `Trang thai don da duoc cap nhat sang ${status}`,
    updatedBy: req.user._id,
  });

  await order.save();

  if (order.user) {
    await createNotification({
      user: order.user,
      title: "Cap nhat don hang",
      message: `Don hang ${order.orderCode} da chuyen sang trang thai ${status}`,
      type: "order",
      metadata: { orderId: order._id, status },
    });
  }

  res.json({
    success: true,
    message: "Order status updated successfully",
    data: order,
  });
});

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  cancelOrder,
  listOrdersAdmin,
  confirmOrder,
  updateOrderStatus,
};
