const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    description: String,
    images: [String],
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "completed"],
      default: "requested",
      index: true,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionNote: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);
