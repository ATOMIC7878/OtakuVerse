const express = require("express");
const router = express.Router();
const {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  downloadNote,
  getNotesByDomain,
} = require("../controllers/notesController");
const { protect } = require("../middleware/authMiddleware");
const { protectAdmin } = require("../middleware/adminMiddleware");
const { upload } = require("../middleware/validationMiddleware");
const { noteValidation, validate } = require("../utils/validators");

// Public routes (require authentication)
router.get("/", protect, getAllNotes);
router.get("/domain/:domain", protect, getNotesByDomain);
router.get("/:id", protect, getNoteById);
router.post("/:id/download", protect, downloadNote);

// Admin only routes
router.post(
  "/",
  protectAdmin,
  upload.single("file"),
  noteValidation,
  validate,
  createNote,
);
router.put("/:id", protectAdmin, updateNote);
router.delete("/:id", protectAdmin, deleteNote);

module.exports = router;
