const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function directCreateAdmin() {
  try {
    await mongoose.connect("mongodb://localhost:27017/otakuverse");
    console.log("✅ Connected to MongoDB");

    const Admin = require("../models/Admin");

    // Delete existing
    await Admin.deleteOne({ email: "superadmin@otakuverse.com" });
    console.log("Deleted existing if any");

    const email = "superadmin@otakuverse.com";
    const password = "SuperAdmin@2026";

    // Generate hash directly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Generated hash:", hashedPassword);

    // Test the hash immediately
    const testResult = await bcrypt.compare(password, hashedPassword);
    console.log("Hash test:", testResult ? "PASSED ✅" : "FAILED ❌");

    // Create admin
    const admin = await Admin.create({
      email: email,
      password: hashedPassword,
      fullName: "System Super Administrator",
      role: "superadmin",
      managedDomains: ["cs", "ds", "it"],
      isActive: true,
    });

    console.log("\n✅ SUPERADMIN CREATED!");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 ID: ${admin._id}`);

    // Final verification
    const verifyAdmin = await Admin.findOne({ email }).select("+password");
    const finalCheck = await bcrypt.compare(password, verifyAdmin.password);
    console.log(
      `\n🔐 Final verification: ${finalCheck ? "✅ WORKING" : "❌ FAILED"}`,
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

directCreateAdmin();
