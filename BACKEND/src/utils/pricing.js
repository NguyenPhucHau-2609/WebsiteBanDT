const ApiError = require("./api-error");

const applyVoucherDiscount = ({ subtotal, voucher }) => {
  if (!voucher) {
    return { discount: 0, voucherCode: null };
  }

  if (!voucher.isActive) {
    throw new ApiError(400, "Voucher is inactive");
  }

  const now = new Date();
  if ((voucher.startAt && voucher.startAt > now) || (voucher.endAt && voucher.endAt < now)) {
    throw new ApiError(400, "Voucher is not in valid time range");
  }

  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    throw new ApiError(400, "Voucher has reached usage limit");
  }

  if (voucher.minOrderValue && subtotal < voucher.minOrderValue) {
    throw new ApiError(400, "Order subtotal does not meet voucher minimum value");
  }

  let discount = 0;
  if (voucher.discountType === "percentage") {
    discount = (subtotal * voucher.discountValue) / 100;
    if (voucher.maxDiscountValue) {
      discount = Math.min(discount, voucher.maxDiscountValue);
    }
  } else {
    discount = voucher.discountValue;
  }

  return {
    discount: Math.min(discount, subtotal),
    voucherCode: voucher.code,
  };
};

const calculateTotals = ({ items, shippingFee = 0, voucher = null }) => {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const { discount, voucherCode } = applyVoucherDiscount({ subtotal, voucher });
  const total = Math.max(subtotal + shippingFee - discount, 0);

  return {
    subtotal,
    discount,
    shippingFee,
    total,
    voucherCode,
  };
};

module.exports = {
  applyVoucherDiscount,
  calculateTotals,
};
