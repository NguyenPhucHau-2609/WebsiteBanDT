const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      default: "Default",
    },
    storage: {
      type: String,
      trim: true,
      default: "Standard",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: [String],
    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Variant", variantSchema);
