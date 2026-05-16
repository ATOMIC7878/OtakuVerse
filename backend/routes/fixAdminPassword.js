const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function fixAdminPassword() {
  try {
    await mongoose.connect("mongodb://localhost:27017/otakuverse");
    console.log("✅ Connected to MongoDB");

    const Admin = require("../models/Admin");

    const email = "superadmin@otakuverse.com";
    const newPassword = "SuperAdmin@2026";

    // Generate new hash
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("New hash generated");

    // Update the password
    const result = await Admin.updateOne(
      { email: email },
      { $set: { password: hashedPassword } },
    );

    if (result.modifiedCount > 0) {
      console.log("\n✅ ADMIN PASSWORD UPDATED SUCCESSFULLY!");
      console.log("=====================================");
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 New Password: ${newPassword}`);
      console.log("=====================================");

      // Verify the password works
      const admin = await Admin.findOne({ email }).select("+password");
      const isValid = await bcrypt.compare(newPassword, admin.password);
      console.log(
        `\n🔐 Password verification: ${isValid ? "✅ WORKING" : "❌ FAILED"}`,
      );
    } else {
      console.log("❌ Admin not found");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixAdminPassword();
