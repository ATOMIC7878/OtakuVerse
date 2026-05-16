const { verifyToken } = require("../utils/jwt");
const Admin = require("../models/Admin");
const ResponseHandler = require("../utils/responseHandler");

const protectAdmin = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return ResponseHandler.unauthorized(res, "Admin access required");
    }

    const decoded = verifyToken(token);
    if (
      !decoded ||
      (decoded.role !== "superadmin" && decoded.role !== "domain-admin")
    ) {
      return ResponseHandler.unauthorized(res, "Invalid admin token");
    }

    // Find admin in Admin collection (not User collection)
    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin || !admin.isActive) {
      return ResponseHandler.unauthorized(
        res,
        "Admin account not found or inactive",
      );
    }

    req.admin = admin;
    next();
  } catch (error) {
    ResponseHandler.error(res, "Admin authentication failed", 401);
  }
};

const requireSuperAdmin = async (req, res, next) => {
  // Check if req.admin exists first
  if (!req.admin) {
    return ResponseHandler.unauthorized(res, "Authentication required");
  }
  // Check for superadmin role
  if (req.admin.role !== "superadmin") {
    return ResponseHandler.forbidden(res, "Superadmin access required");
  }
  next();
};

const checkDomainAccess = (domain) => {
  return (req, res, next) => {
    // Check if req.admin exists first
    if (!req.admin) {
      return ResponseHandler.unauthorized(res, "Authentication required");
    }
    // Superadmin has access to all domains
    if (req.admin.role === "superadmin") {
      return next();
    }
    // Domain admin - check if they have access to the requested domain
    if (req.admin.managedDomains && req.admin.managedDomains.includes(domain)) {
      return next();
    }
    return ResponseHandler.forbidden(
      res,
      `You don't have access to ${domain} domain`,
    );
  };
};

module.exports = { protectAdmin, requireSuperAdmin, checkDomainAccess };
