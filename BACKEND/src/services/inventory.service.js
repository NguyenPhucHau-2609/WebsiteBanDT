const InventoryLog = require("../models/inventory-log.model");
const Variant = require("../models/variant.model");
const ApiError = require("../utils/api-error");

const adjustVariantStock = async ({
  variantId,
  quantityChange,
  type,
  note = "",
  createdBy = null,
}) => {
  const variant = await Variant.findById(variantId);

  if (!variant) {
    throw new ApiError(404, "Variant not found");
  }

  const beforeStock = variant.stock;
  const afterStock = beforeStock + quantityChange;

  if (afterStock < 0) {
    throw new ApiError(400, `Insufficient stock for SKU ${variant.sku}`);
  }

  variant.stock = afterStock;
  await variant.save();

  await InventoryLog.create({
    product: variant.product,
    variant: variant._id,
    type,
    quantityChange,
    beforeStock,
    afterStock,
    note,
    createdBy,
  });

  return variant;
};

module.exports = {
  adjustVariantStock,
};
