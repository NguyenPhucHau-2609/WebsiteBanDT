const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    carrier: {
      type: String,
      required: true,
      trim: true,
    },
    trackingCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["ready_to_ship", "in_transit", "delivered", "failed", "returned"],
      default: "ready_to_ship",
    },
    shippedAt: Date,
    deliveredAt: Date,
    estimatedDeliveryAt: Date,
    note: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shipment", shipmentSchema);
