const SupportTicket = require("../models/support-ticket.model");
const asyncHandler = require("../utils/async-handler");
const ApiError = require("../utils/api-error");
const { createNotification } = require("../services/notification.service");

const createSupportTicket = asyncHandler(async (req, res) => {
  const { subject, message, orderId, priority } = req.body;

  if (!subject || !message) {
    throw new ApiError(400, "subject and message are required");
  }

  const ticket = await SupportTicket.create({
    user: req.user._id,
    order: orderId || null,
    subject,
    message,
    priority: priority || "medium",
  });

  await createNotification({
    targetRole: "staff",
    title: "Yeu cau ho tro moi",
    message: `Khach hang vua tao ticket: ${subject}`,
    type: "support",
    metadata: { ticketId: ticket._id },
  });

  res.status(201).json({
    success: true,
    message: "Support ticket created successfully",
    data: ticket,
  });
});

const getMySupportTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ user: req.user._id })
    .populate("order", "orderCode status total")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: tickets,
  });
});

const replySupportTicket = asyncHandler(async (req, res) => {
  const { message, isInternal = false } = req.body;

  if (!message) {
    throw new ApiError(400, "message is required");
  }

  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found");
  }

  if (req.user.role === "customer" && ticket.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You cannot reply to this ticket");
  }

  ticket.replies.push({
    sender: req.user._id,
    message,
    isInternal: req.user.role === "customer" ? false : Boolean(isInternal),
  });

  if (req.user.role !== "customer" && ticket.status === "open") {
    ticket.status = "in_progress";
  }

  await ticket.save();

  if (req.user.role === "customer") {
    await createNotification({
      targetRole: "staff",
      title: "Khach hang vua phan hoi ticket",
      message: `Ticket ${ticket.subject} vua co phan hoi moi`,
      type: "support",
      metadata: { ticketId: ticket._id },
    });
  } else {
    await createNotification({
      user: ticket.user,
      title: "Ho tro khach hang da phan hoi",
      message: `Ticket ${ticket.subject} vua duoc nhan vien phan hoi`,
      type: "support",
      metadata: { ticketId: ticket._id },
    });
  }

  res.json({
    success: true,
    message: "Reply added successfully",
    data: ticket,
  });
});

const listSupportTickets = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.status) {
    query.status = req.query.status;
  }

  const tickets = await SupportTicket.find(query)
    .populate("user", "fullName email phone")
    .populate("order", "orderCode status total")
    .populate("replies.sender", "fullName role")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: tickets,
  });
});

const updateSupportTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found");
  }

  ticket.status = req.body.status || ticket.status;
  await ticket.save();

  await createNotification({
    user: ticket.user,
    title: "Cap nhat ticket ho tro",
    message: `Ticket ${ticket.subject} da chuyen sang trang thai ${ticket.status}`,
    type: "support",
    metadata: { ticketId: ticket._id },
  });

  res.json({
    success: true,
    message: "Support ticket updated successfully",
    data: ticket,
  });
});

module.exports = {
  createSupportTicket,
  getMySupportTickets,
  replySupportTicket,
  listSupportTickets,
  updateSupportTicketStatus,
};
