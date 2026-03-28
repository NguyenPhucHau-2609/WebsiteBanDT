require("dotenv").config();

const connectDB = require("../config/db");
const User = require("../models/user.model");
const Brand = require("../models/brand.model");
const Category = require("../models/category.model");
const Product = require("../models/product.model");
const Variant = require("../models/variant.model");
const Voucher = require("../models/voucher.model");
const slugify = require("../utils/slugify");

const seed = async () => {
  await connectDB();

  const adminEmail = process.env.SEED_ADMIN_EMAIL
    ? process.env.SEED_ADMIN_EMAIL.toLowerCase()
    : "";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "";
  const adminPhone = process.env.SEED_ADMIN_PHONE || undefined;
  const adminFullName = process.env.SEED_ADMIN_FULL_NAME || "System Admin";

  let admin = null;
  if (adminEmail && adminPassword) {
    admin = await User.findOne({ email: adminEmail }).select("+password");
    if (!admin) {
      admin = new User({
        fullName: adminFullName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        role: "admin",
      });
    } else {
      admin.fullName = adminFullName;
      admin.email = adminEmail;
      admin.phone = adminPhone;
      admin.role = "admin";
      admin.password = adminPassword;
    }

    await admin.save();
  }

  const brand = await Brand.findOneAndUpdate(
    { slug: "apple" },
    {
      name: "Apple",
      slug: "apple",
      description: "Brand seed",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const category = await Category.findOneAndUpdate(
    { slug: "dien-thoai" },
    {
      name: "Dien thoai",
      slug: "dien-thoai",
      description: "Danh muc dien thoai",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const productName = "iPhone 15 Pro Max";
  const product = await Product.findOneAndUpdate(
    { slug: slugify(productName) },
    {
      name: productName,
      slug: slugify(productName),
      skuBase: "IP15PM",
      shortDescription: "Dien thoai cao cap Apple",
      description: "San pham seed de test backend",
      brand: brand._id,
      category: category._id,
      images: [
        "https://example.com/iphone-15-pro-max.jpg",
      ],
      specs: {
        screen: "6.7 inch",
        chip: "A17 Pro",
        camera: "48MP",
      },
      isFeatured: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Variant.findOneAndUpdate(
    { sku: "IP15PM-256-BLK" },
    {
      product: product._id,
      sku: "IP15PM-256-BLK",
      color: "Black",
      storage: "256GB",
      price: 32990000,
      compareAtPrice: 34990000,
      stock: 25,
      isDefault: true,
      images: ["https://example.com/iphone-15-pro-max-black.jpg"],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Voucher.findOneAndUpdate(
    { code: "WELCOME10" },
    {
      code: "WELCOME10",
      description: "Voucher giam 10%",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 1000000,
      maxDiscountValue: 1000000,
      usageLimit: 1000,
      startAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("Seed completed");
  if (admin) {
    console.log("Admin account seeded:", {
      email: admin.email,
      phone: admin.phone,
    });
  } else {
    console.log(
      "Admin seed skipped. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env to create an admin account."
    );
  }

  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
