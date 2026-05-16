const Note = require("../models/Note");
const ResponseHandler = require("../utils/responseHandler");
const logger = require("../utils/logger");

const getAllNotes = async (req, res) => {
  try {
    const { domain, category, search, page = 1, limit = 20 } = req.query;
    const query = { isPublished: true };

    if (domain) query.domain = domain;
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    const notes = await Note.find(query)
      .sort("-publishedAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("uploader", "email");

    const total = await Note.countDocuments(query);

    ResponseHandler.success(res, {
      notes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      "uploader",
      "email",
    );

    if (!note) {
      return ResponseHandler.notFound(res, "Note not found");
    }

    // Increment view count
    note.views += 1;
    await note.save();

    ResponseHandler.success(res, note);
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

const createNote = async (req, res) => {
  try {
    const noteData = {
      ...req.body,
      uploader: req.admin._id,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      fileName: req.file ? req.file.originalname : null,
      fileSize: req.file ? req.file.size : 0,
    };

    const note = await Note.create(noteData);

    logger.info(`New note created: ${note.title} by admin ${req.admin.email}`);

    ResponseHandler.created(res, note, "Note created successfully");
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

const updateNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!note) {
      return ResponseHandler.notFound(res, "Note not found");
    }

    ResponseHandler.success(res, note, "Note updated successfully");
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

const deleteNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
      return ResponseHandler.notFound(res, "Note not found");
    }

    ResponseHandler.success(res, null, "Note deleted successfully");
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

const downloadNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return ResponseHandler.notFound(res, "Note not found");
    }

    note.downloads += 1;
    await note.save();

    ResponseHandler.success(res, { downloadUrl: note.fileUrl });
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

const getNotesByDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    const notes = await Note.find({ domain, isPublished: true })
      .sort("-publishedAt")
      .limit(50);

    ResponseHandler.success(res, notes);
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
};

module.exports = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  downloadNote,
  getNotesByDomain,
};
