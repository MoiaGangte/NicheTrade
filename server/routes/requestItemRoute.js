import express from "express";
import multer from "multer";
import { lostFoundUpload } from "../configs/multer.js";
import { confirmRequestItem, createRequestItem, getRequestItem, listRequestItems } from "../controllers/requestItemController.js";
import { authUser } from "../middleware/authMiddleware.js";

const requestItemRouter = express.Router();

requestItemRouter.get("/", listRequestItems);
requestItemRouter.get("/:id", getRequestItem);
requestItemRouter.post("/:id/confirm", authUser, confirmRequestItem);
requestItemRouter.post(
    "/",
    authUser,
    lostFoundUpload.single("image"),
    (error, _req, res, next) => {
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ success: false, message: "Image must be 5 MB or smaller" });
        }
        next(error);
    },
    createRequestItem,
);

export default requestItemRouter;
