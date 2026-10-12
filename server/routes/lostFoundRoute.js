import express from "express";
import multer from "multer";
import { lostFoundUpload } from "../configs/multer.js";
import {
    confirmLostFoundClaim,
    createLostFoundPost,
    getLostFoundFounder,
    getLostFoundPost,
    listLostFoundPosts,
} from "../controllers/lostFoundController.js";

const lostFoundRouter = express.Router();

lostFoundRouter.get("/", listLostFoundPosts);
lostFoundRouter.post(
    "/",
    lostFoundUpload.single("image"),
    (error, _req, res, next) => {
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ success: false, message: "Image must be 5 MB or smaller" });
        }
        next(error);
    },
    createLostFoundPost,
);
lostFoundRouter.get("/:id", getLostFoundPost);
lostFoundRouter.get("/:id/claim", getLostFoundFounder);
lostFoundRouter.post("/:id/confirm", confirmLostFoundClaim);

export default lostFoundRouter;
