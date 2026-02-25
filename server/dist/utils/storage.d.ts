/** Resolve absolute path to the uploads directory. */
export declare function getUploadDir(): string;
/** Build a public URL for a stored file. */
export declare function buildFileUrl(storedName: string, req: {
    protocol: string;
    get: (h: string) => string | undefined;
}): string;
/** Delete a file from storage by its stored name. */
export declare function deleteFile(storedName: string): void;
//# sourceMappingURL=storage.d.ts.map