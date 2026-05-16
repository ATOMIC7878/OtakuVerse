const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function resetSuperAdminPassword() {
  try {
    await mongoose.connect("mongodb://localhost:27017/otakuverse");
    console.log("✅ Connected to MongoDB");

    // FIXED: Use Admin model, NOT User model
    const Admin = require("../models/Admin");

    const newPassword = "SuperAdmin@2026";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await Admin.updateOne(
      { email: "superadmin@otakuverse.com" },
      { $set: { password: hashedPassword } },
    );

    if (result.modifiedCount > 0) {
      console.log("\n✅ SUPERADMIN PASSWORD RESET SUCCESSFULLY!");
      console.log("=====================================");
      console.log(`📧 Email: superadmin@otakuverse.com`);
      console.log(`🔑 New Password: ${newPassword}`);
      console.log("=====================================");
    } else {
      console.log("❌ Superadmin not found");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

resetSuperAdminPassword();
