const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");
const ResponseHandler = require("../utils/responseHandler");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return ResponseHandler.unauthorized(res, "You are not logged in");
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return ResponseHandler.unauthorized(res, "Invalid token");
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return ResponseHandler.unauthorized(res, "User no longer exists");
    }

    if (!user.isActive) {
      return ResponseHandler.unauthorized(res, "User account is deactivated");
    }

    req.user = user;
    next();
  } catch (error) {
    ResponseHandler.error(res, "Authentication failed", 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      const decoded = verifyToken(token);

      if (decoded) {
        const user = await User.findById(decoded.id).select("-password");
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = { protect, optionalAuth };
