const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  PACKED: "packed",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELED: "canceled",
  RETURN_REQUESTED: "return_requested",
  RETURNED: "returned",
  REFUNDED: "refunded",
};

const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
};

module.exports = {
  ORDER_STATUS,
  PAYMENT_STATUS,
};
