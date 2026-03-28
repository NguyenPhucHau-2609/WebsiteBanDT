const express = require("express");

const supportController = require("../controllers/support.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);
router.post("/", supportController.createSupportTicket);
router.get("/", supportController.getMySupportTickets);
router.post("/:id/replies", supportController.replySupportTicket);

module.exports = router;
