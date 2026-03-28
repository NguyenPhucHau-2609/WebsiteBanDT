const Order = require("../models/order.model");
const Product = require("../models/product.model");
const SupportTicket = require("../models/support-ticket.model");
const Variant = require("../models/variant.model");
const asyncHandler = require("../utils/async-handler");

const getOverview = asyncHandler(async (_req, res) => {
  const [orderStats, productCount, supportOpenCount, lowStockCount, revenueByMonth, topProducts] =
    await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $eq: ["$status", "delivered"] }, "$total", 0],
              },
            },
            pendingOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
              },
            },
          },
        },
      ]),
      Product.countDocuments(),
      SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
      Variant.countDocuments({ stock: { $lte: 5 } }),
      Order.aggregate([
        {
          $match: {
            status: "delivered",
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Order.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            soldQuantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.lineTotal" },
            productName: { $first: "$items.productName" },
          },
        },
        { $sort: { soldQuantity: -1 } },
        { $limit: 10 },
      ]),
    ]);

  res.json({
    success: true,
    data: {
      summary: orderStats[0] || {
        totalOrders: 0,
        revenue: 0,
        pendingOrders: 0,
      },
      productCount,
      supportOpenCount,
      lowStockCount,
      revenueByMonth,
      topProducts,
    },
  });
});

module.exports = {
  getOverview,
};
