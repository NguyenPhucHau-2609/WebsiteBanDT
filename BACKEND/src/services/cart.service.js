const { nanoid } = require("nanoid");

const Cart = require("../models/cart.model");
const Variant = require("../models/variant.model");
const ApiError = require("../utils/api-error");
const { calculateTotals } = require("../utils/pricing");
const Voucher = require("../models/voucher.model");

const resolveCartOwner = (req) => {
  if (req.user) {
    return {
      filter: { user: req.user._id },
      guestId: null,
      isGuest: false,
    };
  }

  const guestId =
    req.headers["x-guest-id"] || req.body.guestId || req.query.guestId || `guest_${nanoid(12)}`;

  return {
    filter: { guestId, user: null },
    guestId,
    isGuest: true,
  };
};

const getOrCreateCart = async (req) => {
  const owner = resolveCartOwner(req);
  let cart = await Cart.findOne(owner.filter);

  if (!cart) {
    cart = await Cart.create({
      user: req.user ? req.user._id : null,
      guestId: owner.guestId,
      items: [],
    });
  }

  return { cart, owner };
};

const hydrateCart = async (cart) => {
  await cart.populate([
    {
      path: "items.product",
      populate: [
        { path: "brand", select: "name slug" },
        { path: "category", select: "name slug" },
      ],
    },
    {
      path: "items.variant",
      select: "sku color storage price compareAtPrice stock images",
    },
  ]);

  const voucher = cart.appliedVoucherCode
    ? await Voucher.findOne({ code: cart.appliedVoucherCode.toUpperCase() })
    : null;

  const items = cart.items
    .filter((item) => item.product && item.variant)
    .map((item) => ({
      itemId: item._id,
      product: item.product,
      variant: item.variant,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
    }));

  const totals = calculateTotals({
    items,
    voucher,
  });

  return {
    id: cart._id,
    user: cart.user,
    guestId: cart.guestId,
    appliedVoucherCode: cart.appliedVoucherCode,
    items,
    totals,
  };
};

const syncCartItemPrice = async (variantId) => {
  const variant = await Variant.findById(variantId);

  if (!variant || !variant.isActive) {
    throw new ApiError(404, "Variant not found or inactive");
  }

  return variant;
};

module.exports = {
  getOrCreateCart,
  hydrateCart,
  resolveCartOwner,
  syncCartItemPrice,
};
