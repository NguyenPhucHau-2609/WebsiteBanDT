const mongoose = require("mongoose");

const timelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    variantName: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    image: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    guestInfo: {
      fullName: String,
      email: String,
      phone: String,
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      province: String,
      district: String,
      ward: String,
      street: String,
      note: String,
    },
    note: String,
    status: {
      type: String,
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "vnpay", "momo", "bank_transfer"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      default: "pending",
      index: true,
    },
    voucherCode: {
      type: String,
      default: null,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    timeline: [timelineSchema],
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deliveredAt: Date,
    canceledAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
