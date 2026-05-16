const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Superadmin credentials - Using real email format
const SUPER_ADMIN = {
  email: "superadmin@otakuverse.com", // Can be any valid email format: @gmail.com, @yahoo.com, @outlook.com, @custom-domain.com
  password: "SuperAdmin@2026",
  fullName: "System Super Administrator",
  role: "superadmin",
  managedDomains: ["cs", "ds", "it"],
  isActive: true,
};

async function createSuperAdmin() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/otakuverse",
    );
    console.log("✅ Connected to MongoDB");

    const Admin = require("../models/Admin");

    // Email validation function (supports all real email formats)
    function isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    // Validate email format
    if (!isValidEmail(SUPER_ADMIN.email)) {
      console.log("❌ Invalid email format!");
      console.log(`📧 Provided: ${SUPER_ADMIN.email}`);
      console.log("💡 Email should be in format: name@domain.com");
      process.exit(1);
    }

    console.log(`📧 Email validation passed: ${SUPER_ADMIN.email}`);

    // Check if superadmin already exists in Admin collection
    const existingSuperAdmin = await Admin.findOne({ role: "superadmin" });
    if (existingSuperAdmin) {
      console.log("⚠️ Superadmin already exists in Admin collection!");
      console.log(`📧 Email: ${existingSuperAdmin.email}`);
      console.log(`👤 Name: ${existingSuperAdmin.fullName}`);
      console.log(`🆔 ID: ${existingSuperAdmin._id}`);
      process.exit(0);
    }

    // Check if email already exists in Admin collection
    const existingEmail = await Admin.findOne({ email: SUPER_ADMIN.email });
    if (existingEmail) {
      console.log(
        `⚠️ Email ${SUPER_ADMIN.email} already exists in Admin collection!`,
      );
      process.exit(0);
    }

    // Create superadmin in Admin collection
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 10);
    const superAdmin = await Admin.create({
      email: SUPER_ADMIN.email.toLowerCase(), // Store email in lowercase for consistency
      password: hashedPassword,
      fullName: SUPER_ADMIN.fullName,
      role: SUPER_ADMIN.role,
      managedDomains: SUPER_ADMIN.managedDomains,
      isActive: SUPER_ADMIN.isActive,
      createdAt: new Date(),
    });

    console.log("\n✅ SUPERADMIN CREATED SUCCESSFULLY!");
    console.log("=====================================");
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`🔑 Password: ${SUPER_ADMIN.password}`);
    console.log(`👤 Name: ${superAdmin.fullName}`);
    console.log(`🆔 ID: ${superAdmin._id}`);
    console.log(`📁 Managed Domains: ${superAdmin.managedDomains.join(", ")}`);
    console.log("=====================================");
    console.log("💡 Supported email formats:");
    console.log("   • username@gmail.com");
    console.log("   • username@yahoo.com");
    console.log("   • username@outlook.com");
    console.log("   • username@any-custom-domain.com");
    console.log("=====================================");
    console.log("⚠️  Please change these credentials after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating superadmin:", error.message);
    if (error.code === 11000) {
      console.log("⚠️ Duplicate key error. Email already exists.");
    }
    process.exit(1);
  }
}

createSuperAdmin();
