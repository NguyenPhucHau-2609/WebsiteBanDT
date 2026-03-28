const mongoose = require("mongoose");

const inventoryLogSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: [
        "manual_adjustment",
        "order_deducted",
        "order_restocked",
        "return_restocked",
      ],
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    beforeStock: {
      type: Number,
      required: true,
      min: 0,
    },
    afterStock: {
      type: Number,
      required: true,
      min: 0,
    },
    note: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("InventoryLog", inventoryLogSchema);
