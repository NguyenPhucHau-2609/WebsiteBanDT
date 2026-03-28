const Product = require("../models/product.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");
const { getOrCreateCart, hydrateCart, syncCartItemPrice } = require("../services/cart.service");

const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;

  if (!productId || !variantId) {
    throw new ApiError(400, "productId and variantId are required");
  }

  const [product, variant, { cart, owner }] = await Promise.all([
    Product.findById(productId),
    syncCartItemPrice(variantId),
    getOrCreateCart(req),
  ]);

  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found or inactive");
  }

  if (variant.product.toString() !== product._id.toString()) {
    throw new ApiError(400, "Variant does not belong to the selected product");
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId && item.variant.toString() === variantId
  );

  if (existingItem) {
    existingItem.quantity += Number(quantity);
    existingItem.unitPrice = variant.price;
  } else {
    cart.items.push({
      product: product._id,
      variant: variant._id,
      quantity: Number(quantity),
      unitPrice: variant.price,
    });
  }

  await cart.save();

  res.status(201).json({
    success: true,
    message: "Added to cart successfully",
    data: {
      guestId: owner.guestId,
      cart: await hydrateCart(cart),
    },
  });
});

const getCart = asyncHandler(async (req, res) => {
  const { cart, owner } = await getOrCreateCart(req);

  res.json({
    success: true,
    data: {
      guestId: owner.guestId,
      cart: await hydrateCart(cart),
    },
  });
});

const updateCart = asyncHandler(async (req, res) => {
  const { itemId, quantity } = req.body;

  if (!itemId || quantity === undefined) {
    throw new ApiError(400, "itemId and quantity are required");
  }

  const { cart } = await getOrCreateCart(req);
  const item = cart.items.id(itemId);

  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  if (Number(quantity) <= 0) {
    item.deleteOne();
  } else {
    const variant = await syncCartItemPrice(item.variant);
    item.quantity = Number(quantity);
    item.unitPrice = variant.price;
  }

  await cart.save();

  res.json({
    success: true,
    message: "Cart updated successfully",
    data: await hydrateCart(cart),
  });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const itemId = req.params.itemId || req.body.itemId;

  if (!itemId) {
    throw new ApiError(400, "itemId is required");
  }

  const { cart } = await getOrCreateCart(req);
  const item = cart.items.id(itemId);

  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  item.deleteOne();
  await cart.save();

  res.json({
    success: true,
    message: "Cart item removed successfully",
    data: await hydrateCart(cart),
  });
});

const clearCart = asyncHandler(async (req, res) => {
  const { cart } = await getOrCreateCart(req);
  cart.items = [];
  cart.appliedVoucherCode = null;
  await cart.save();

  res.json({
    success: true,
    message: "Cart cleared successfully",
    data: await hydrateCart(cart),
  });
});

const getCartCount = asyncHandler(async (req, res) => {
  const { cart, owner } = await getOrCreateCart(req);
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  res.json({
    success: true,
    data: {
      guestId: owner.guestId,
      count,
    },
  });
});

module.exports = {
  addToCart,
  getCart,
  updateCart,
  removeCartItem,
  clearCart,
  getCartCount,
};
