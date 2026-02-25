import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

/** Resolve absolute path to the uploads directory. */
export function getUploadDir(): string {
  const dir = path.resolve(process.cwd(), UPLOAD_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** Build a public URL for a stored file. */
export function buildFileUrl(storedName: string, req: { protocol: string; get: (h: string) => string | undefined }): string {
  const host = req.get('host') || 'localhost:3000';
  return `${req.protocol}://${host}/uploads/${storedName}`;
}

/** Delete a file from storage by its stored name. */
export function deleteFile(storedName: string): void {
  const filePath = path.join(getUploadDir(), storedName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
