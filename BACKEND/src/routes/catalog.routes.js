const express = require("express");

const catalogController = require("../controllers/catalog.controller");

const router = express.Router();

router.get("/categories", catalogController.getCategories);
router.get("/brands", catalogController.getBrands);

module.exports = router;
