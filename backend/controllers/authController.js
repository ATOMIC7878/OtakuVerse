const User = require("../models/User");
const Admin = require("../models/Admin");
const { generateToken } = require("../utils/jwt");
const ResponseHandler = require("../utils/responseHandler");
const logger = require("../utils/logger");

const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if user already exists in User collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ResponseHandler.badRequest(
        res,
        "User already exists with this email",
      );
    }

    // Check if email is not already used by an admin
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return ResponseHandler.badRequest(
        res,
        "This email is registered as admin. Please use different email.",
      );
    }

    // Create user (aspirant) - only in User collection
    const user = await User.create({
      email,
      password,
      fullName: fullName || email.split("@")[0],
      role: "aspirant",
      isActive: true,
    });

    // Generate token
    const token = generateToken(user._id, "aspirant");

    // Remove password from output
    user.password = undefined;

    logger.info(`New aspirant registered: ${email}`);

    ResponseHandler.success(
      res,
      {
        user,
        token,
      },
      "Registration successful",
      201,
    );
  } catch (error) {
    logger.error("Registration error:", error);
    ResponseHandler.error(res, error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // FIRST: Check in Admin collection (superadmin or domain-admin)
    let admin = await Admin.findOne({ email }).select("+password");

    if (admin) {
      // Admin exists - check password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        return ResponseHandler.unauthorized(res, "Invalid email or password");
      }

      // Check if admin is active
      if (!admin.isActive) {
        return ResponseHandler.unauthorized(
          res,
          "Your admin account has been deactivated. Contact superadmin.",
        );
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save({ validateBeforeSave: false });

      // Generate token with admin role
      const token = generateToken(admin._id, admin.role);

      // Remove password from output
      admin.password = undefined;

      logger.info(`Admin logged in: ${email} (${admin.role})`);

      return ResponseHandler.success(
        res,
        {
          admin,
          token,
          userType: "admin",
        },
        "Admin login successful",
      );
    }

    // SECOND: Check in User collection (aspirant)
    let user = await User.findOne({ email }).select("+password");

    if (user) {
      // User exists - check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return ResponseHandler.unauthorized(res, "Invalid email or password");
      }

      // Check if user is active
      if (!user.isActive) {
        return ResponseHandler.unauthorized(
          res,
          "Your account has been deactivated. Contact support.",
        );
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      // Generate token with aspirant role
      const token = generateToken(user._id, "aspirant");

      // Remove password from output
      user.password = undefined;

      logger.info(`Aspirant logged in: ${email}`);

      return ResponseHandler.success(
        res,
        {
          user,
          token,
          userType: "aspirant",
        },
        "Login successful",
      );
    }

    // Neither admin nor user found
    return ResponseHandler.unauthorized(res, "Invalid email or password");
  } catch (error) {
    logger.error("Login error:", error);
    ResponseHandler.error(res, error.message);
  }
};

const getProfile = async (req, res) => {
  try {
    // req.user is set by auth middleware
    ResponseHandler.success(res, req.user, "Profile fetched successfully");
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ["fullName"];
    const updates = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Determine which collection to update based on user role
    let updatedUser;
    if (req.user.role === "aspirant") {
      updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      }).select("-password");
    } else {
      updatedUser = await Admin.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      }).select("-password");
    }

    ResponseHandler.success(res, updatedUser, "Profile updated successfully");
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
};
