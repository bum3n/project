"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const storage_1 = require("../utils/storage");
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10 MB
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, (0, storage_1.getUploadDir)());
    },
    filename: (_req, file, cb) => {
        // UUID + original extension ensures uniqueness without exposing user data
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    },
});
/** Allow images, documents, audio, and video files. */
function fileFilter(_req, file, cb) {
    const ALLOWED_MIMES = [
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // Documents
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        // Audio
        'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
        // Video
        'video/mp4', 'video/webm', 'video/ogg',
        // Archives
        'application/zip', 'application/x-rar-compressed',
    ];
    if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`File type '${file.mimetype}' is not allowed`));
    }
}
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
});
//# sourceMappingURL=upload.js.map