const Admin = require("../models/Admin");
const User = require("../models/User");
const Note = require("../models/Note");
const { generateToken } = require("../utils/jwt");
const ResponseHandler = require("../utils/responseHandler");
const logger = require("../utils/logger");

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return ResponseHandler.unauthorized(res, "Invalid admin credentials");
    }

    // Check if admin is active
    if (!admin.isActive) {
      return ResponseHandler.unauthorized(
        res,
        "Your admin account has been deactivated. Contact superadmin.",
      );
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return ResponseHandler.unauthorized(res, "Invalid admin credentials");
    }

    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    // Generate token with admin's actual role
    const token = generateToken(admin._id, admin.role);
    admin.password = undefined;

    logger.info(`Admin logged in: ${email} (${admin.role})`);

    ResponseHandler.success(res, { admin, token }, "Admin login successful");
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalAdmins: await Admin.countDocuments(),
      totalNotes: await Note.countDocuments(),
      totalDownloads: await Note.aggregate([
        { $group: { _id: null, total: { $sum: "$downloads" } } },
      ]),
      notesByDomain: await Note.aggregate([
        { $group: { _id: "$domain", count: { $sum: 1 } } },
      ]),
      recentUsers: await User.find().sort("-createdAt").limit(5),
      recentNotes: await Note.find()
        .sort("-createdAt")
        .limit(5)
        .populate("uploader", "email"),
    };

    ResponseHandler.success(res, stats);
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

// Get all ASPIRANTS (users collection only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    ResponseHandler.success(res, users);
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

// Get all ADMINS (admin collection only) - Superadmin only
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select("-password")
      .sort({ createdAt: -1 });
    ResponseHandler.success(res, admins);
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

// Create new DOMAIN ADMIN (Superadmin only)
const createDomainAdmin = async (req, res) => {
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
        "This email is already registered as a user. Cannot create admin.",
      );
    }

    // Create new domain admin
    const newAdmin = await Admin.create({
      email,
      password,
      fullName,
      role: "domain-admin",
      managedDomains: managedDomains || [],
      isActive: true,
      createdBy: req.admin._id, // Track which superadmin created this admin
    });

    newAdmin.password = undefined;
    logger.info(`New domain admin created: ${email} by ${req.admin.email}`);

    ResponseHandler.created(res, newAdmin, "Domain admin created successfully");
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

// Update DOMAIN ADMIN (Superadmin only)
const updateDomainAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { managedDomains, isActive, fullName } = req.body;

    const admin = await Admin.findById(id);
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
};

// Delete DOMAIN ADMIN (Superadmin only)
const deleteDomainAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);

    if (!admin) {
      return ResponseHandler.notFound(res, "Admin not found");
    }

    // Prevent deleting superadmin
    if (admin.role === "superadmin") {
      return ResponseHandler.forbidden(res, "Cannot delete superadmin");
    }

    await Admin.findByIdAndDelete(id);
    logger.info(`Domain admin deleted: ${admin.email} by ${req.admin.email}`);

    ResponseHandler.success(res, null, "Admin deleted successfully");
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

// Toggle ASPIRANT user status (Admin can block/unblock aspirants)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return ResponseHandler.notFound(res, "User not found");
    }

    user.isActive = !user.isActive;
    await user.save();

    const status = user.isActive ? "activated" : "deactivated";
    ResponseHandler.success(res, user, `User ${status} successfully`);
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

// Delete ASPIRANT user (Admin can delete users)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return ResponseHandler.notFound(res, "User not found");
    }

    await User.findByIdAndDelete(id);
    ResponseHandler.success(res, null, "User deleted successfully");
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

// Get accessible domains for current admin
const getAccessibleDomains = async (req, res) => {
  try {
    const allDomains = ["cs", "ds", "it"];

    if (req.admin.role === "superadmin") {
      return ResponseHandler.success(res, allDomains);
    }

    // Domain admin - return only assigned domains
    const accessibleDomains = req.admin.managedDomains || [];
    ResponseHandler.success(res, accessibleDomains);
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getAllAdmins,
  createDomainAdmin,
  updateDomainAdmin,
  deleteDomainAdmin,
  toggleUserStatus,
  deleteUser,
  getAccessibleDomains,
};
