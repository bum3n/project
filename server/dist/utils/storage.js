"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadDir = getUploadDir;
exports.buildFileUrl = buildFileUrl;
exports.deleteFile = deleteFile;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
/** Resolve absolute path to the uploads directory. */
function getUploadDir() {
    const dir = path_1.default.resolve(process.cwd(), UPLOAD_DIR);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    return dir;
}
/** Build a public URL for a stored file. */
function buildFileUrl(storedName, req) {
    const host = req.get('host') || 'localhost:3000';
    return `${req.protocol}://${host}/uploads/${storedName}`;
}
/** Delete a file from storage by its stored name. */
function deleteFile(storedName) {
    const filePath = path_1.default.join(getUploadDir(), storedName);
    if (fs_1.default.existsSync(filePath)) {
        fs_1.default.unlinkSync(filePath);
    }
}
//# sourceMappingURL=storage.js.map