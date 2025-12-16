import express from "express";
import { protectedRoutes } from "../../middlewares/auth.middleware.js";
import { uploadAny } from "../../config/cloudinary.message.js";
import {
  createConversation,
  sendMessage,
  deleteMessage,
  updateMessage,
  fetchMessages,
} from "../../controllers/chat/message.controller.js";

const router = express.Router();

// routes for chat
router.post("/create-conversation", protectedRoutes, createConversation);

// For send-message: allow an optional single attachment named "attachment".
// Use multipart/form-data when the client sends a file.
// If the client sends text-only as JSON, this route will still work (req.file will be undefined).
router.post(
  "/send-message",
  protectedRoutes,
  uploadAny.single("attachment"),
  sendMessage
);

router.delete("/delete-message", protectedRoutes, deleteMessage);
router.put("/update-message", protectedRoutes, updateMessage);
router.get("/fetch-messages", protectedRoutes, fetchMessages);

export default router;