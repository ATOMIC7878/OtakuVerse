const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notesRoutes = require("./routes/notesRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

// ===== UPDATED CORS CONFIGURATION FOR PRODUCTION =====
// Get allowed origins from environment variable
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5500";

// Build allowed origins array
const allowedOrigins = [
  "http://localhost:5500",
  "http://localhost:5501",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5501",
  corsOrigin, // Your Netlify URL from environment variable
];

console.log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // Check if origin is allowed
      if (allowedOrigins.indexOf(origin) !== -1 || origin === corsOrigin) {
        return callback(null, true);
      }

      // Also allow any origin in production if it matches the pattern
      if (process.env.NODE_ENV === "production" && origin) {
        console.log(`CORS allowed (production): ${origin}`);
        return callback(null, true);
      }

      console.log(`Blocked CORS from origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// Handle preflight requests
app.options("*", cors());

// Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/notes", notesRoutes);

// Health check
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "success", message: "OtakuVerse API is running" });
});

// Home route
app.get("/", (req, res) => {
  res.json({
    name: "OtakuVerse API",
    tagline: "Where Knowledge Meets Infinity",
    version: "1.0.0",
    status: "active",
    environment: process.env.NODE_ENV,
    cors_origin: corsOrigin,
  });
});

// Error handling middleware
app.use(errorMiddleware);

module.exports = app;
