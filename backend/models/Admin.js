const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    fullName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "domain-admin"],
      required: true,
      default: "domain-admin",
    },
    managedDomains: [
      {
        type: String,
        enum: ["cs", "ds", "it"],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    lastLogin: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// FIXED: Only hash if password is modified and not already hashed
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // Check if password is already hashed (bcrypt hashes start with $2a$)
  if (this.password && !this.password.startsWith("$2a$")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
