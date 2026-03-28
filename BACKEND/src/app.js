const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
    docs: {
      health: "/api/health",
      auth: "/api/auth",
      products: "/api/products",
      admin: "/api/admin",
    },
  });
});

app.get("/api", (_req, res) => {
  res.json({
    success: true,
    message: "API root",
    routes: {
      health: "GET /api/health",
      register: "POST /api/auth/register",
      login: "POST /api/auth/login",
      profile: "GET /api/user/profile",
      products: "GET /api/products",
      productDetail: "GET /api/products/:id",
      cart: "GET/POST/PUT/DELETE /api/cart",
      orders: "POST /api/orders",
      adminOrders: "GET /api/admin/orders",
      adminInventory: "GET /api/admin/inventory",
    },
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
