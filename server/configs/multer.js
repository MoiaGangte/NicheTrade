
import multer from "multer";

export const upload = multer({storage: multer.diskStorage({})})
export const lostFoundUpload = multer({
    storage: multer.diskStorage({}),
    limits: { fileSize: 5 * 1024 * 1024 },
});