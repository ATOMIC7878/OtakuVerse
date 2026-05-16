const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Admin = require("../models/Admin");
const {
  protectAdmin,
  requireSuperAdmin,
} = require("../middleware/adminMiddleware");
const ResponseHandler = require("../utils/responseHandler");
const { generateToken } = require("../utils/jwt");

// ===== ADMIN LOGIN ROUTE (Checks Admin collection only) =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Debug logs
    console.log("=== ADMIN LOGIN DEBUG ===");
    console.log("1. Received email:", email);
    console.log("2. Received password length:", password ? password.length : 0);

    // Find admin in Admin collection
    const admin = await Admin.findOne({ email }).select("+password");
    console.log("3. Admin found in database:", admin ? "YES" : "NO");

    if (!admin) {
      console.log("4. Result: Admin not found - 401");
      return ResponseHandler.unauthorized(res, "Invalid admin credentials");
    }

    console.log("5. Admin email:", admin.email);
    console.log("6. Admin role:", admin.role);
    console.log("7. Admin isActive:", admin.isActive);
    console.log("8. Admin has password hash:", admin.password ? "YES" : "NO");

    if (!admin.isActive) {
      console.log("9. Result: Account deactivated - 401");
      return ResponseHandler.unauthorized(
        res,
        "Account is deactivated. Contact superadmin.",
      );
    }

    const isPasswordValid = await admin.comparePassword(password);
    console.log(
      "10. Password validation result:",
      isPasswordValid ? "VALID ✅" : "INVALID ❌",
    );

    if (!isPasswordValid) {
      console.log("11. Result: Invalid password - 401");
      return ResponseHandler.unauthorized(res, "Invalid admin credentials");
    }

    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = generateToken(admin._id, admin.role);
    admin.password = undefined;

    console.log("12. Result: LOGIN SUCCESSFUL ✅");
    console.log("================================");
    ResponseHandler.success(res, { admin, token }, "Admin login successful");
  } catch (error) {
    console.error("Login error:", error);
    ResponseHandler.error(res, error.message);
  }
});

// Get current admin profile (from Admin collection)
router.get("/profile", protectAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select("-password");
    ResponseHandler.success(res, admin);
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

// Get all aspirant users (from User collection only)
router.get("/users", protectAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    ResponseHandler.success(res, users);
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

// Get all admins (from Admin collection) - Superadmin only
router.get("/admins", protectAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.find()
      .select("-password")
      .sort({ createdAt: -1 });
    ResponseHandler.success(res, admins);
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

// Create new domain admin (saves to Admin collection) - Superadmin only
router.post("/admins", protectAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, fullName, managedDomains } = req.body;

    // Check if already exists in Admin collection
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return ResponseHandler.badRequest(
        res,
        "Admin already exists with this email",
      );
    }

    // Check if email is not used by a regular user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ResponseHandler.badRequest(
        res,
        "This email is already registered as a user",
      );
    }

    // Create new domain admin in Admin collection
    const newAdmin = await Admin.create({
      email,
      password,
      fullName,
      role: "domain-admin",
      managedDomains: managedDomains || [],
      isActive: true,
      createdBy: req.admin._id,
    });

    newAdmin.password = undefined;
    ResponseHandler.created(res, newAdmin, "Domain admin created successfully");
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

// Update domain admin - Superadmin only
router.put("/admins/:id", protectAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { managedDomains, isActive, fullName } = req.body;

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return ResponseHandler.notFound(res, "Admin not found");
    }

    // Prevent modifying superadmin
    if (admin.role === "superadmin") {
      return ResponseHandler.forbidden(res, "Cannot modify superadmin");
    }

    admin.managedDomains =
      managedDomains !== undefined ? managedDomains : admin.managedDomains;
    admin.isActive = isActive !== undefined ? isActive : admin.isActive;
    admin.fullName = fullName || admin.fullName;
    await admin.save();

    admin.password = undefined;
    ResponseHandler.success(res, admin, "Admin updated successfully");
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

// Delete domain admin - Superadmin only
router.delete(
  "/admins/:id",
  protectAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const admin = await Admin.findById(req.params.id);
      if (!admin) {
        return ResponseHandler.notFound(res, "Admin not found");
      }

      // Prevent deleting superadmin
      if (admin.role === "superadmin") {
        return ResponseHandler.forbidden(res, "Cannot delete superadmin");
      }

      await Admin.findByIdAndDelete(req.params.id);
      ResponseHandler.success(res, null, "Admin deleted successfully");
    } catch (error) {
      ResponseHandler.error(res, error.message);
    }
  },
);

// Toggle user status (block/unblock aspirant from User collection)
router.put("/users/:id/toggle-status", protectAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return ResponseHandler.notFound(res, "User not found");
    }

    user.isActive = !user.isActive;
    await user.save();

    const status = user.isActive ? "activated" : "blocked";
    ResponseHandler.success(res, user, `User ${status} successfully`);
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

// Delete aspirant user from User collection
router.delete("/users/:id", protectAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return ResponseHandler.notFound(res, "User not found");
    }

    await User.findByIdAndDelete(req.params.id);
    ResponseHandler.success(res, null, "User deleted successfully");
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

// Get domains accessible to current admin
router.get("/accessible-domains", protectAdmin, async (req, res) => {
  try {
    const allDomains = ["cs", "ds", "it"];

    if (req.admin.role === "superadmin") {
      return ResponseHandler.success(res, allDomains);
    }

    const accessibleDomains = req.admin.managedDomains || [];
    ResponseHandler.success(res, accessibleDomains);
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

module.exports = router;
