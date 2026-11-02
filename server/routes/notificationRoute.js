import express from "express";
import { authUser } from "../middleware/authMiddleware.js";
import { listNotifications, markNotificationRead, unreadNotificationCount } from "../controllers/notificationController.js";

const router = express.Router();
router.use(authUser);
router.get("/", listNotifications);
router.get("/unread-count", unreadNotificationCount);
router.patch("/:notificationId/read", markNotificationRead);

export default router;
