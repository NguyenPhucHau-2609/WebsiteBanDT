const express = require("express");

const returnController = require("../controllers/return.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);
router.post("/", returnController.createReturnRequest);
router.get("/", returnController.listReturnRequests);

module.exports = router;
