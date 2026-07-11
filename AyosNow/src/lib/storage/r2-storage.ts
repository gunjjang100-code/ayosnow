import { getCloudflareContext } from "@opennextjs/cloudflare";
import { UploadAccess, UploadFolder } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const CHAT_UPLOAD_MAX_BYTES = 2_500_000;

export const CHAT_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const CHAT_FILE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

const UPLOAD_BUCKET_BINDING = "PUNTAGO_UPLOADS_R2_BUCKET";
const UPLOAD_BUCKET_NAME = "puntago-uploads";

const folderPathByFolder = {
  [UploadFolder.CHAT]: "chat",
  [UploadFolder.PROFILE]: "profile",
  [UploadFolder.PORTFOLIO]: "portfolio",
  [UploadFolder.SERVICES]: "services",
  [UploadFolder.REVIEWS]: "reviews",
  [UploadFolder.REPORTS]: "reports",
  [UploadFolder.DOCUMENTS]: "documents",
} satisfies Record<UploadFolder, string>;

const extensionByMimeType: Record<string, string> = {
  "application/msword": "doc",
  "application/pdf": "pdf",
  "application/vnd.ms-excel": "xls",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "text/csv": "csv",
  "text/plain": "txt",
};

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export interface UploadDataUrlParams {
  dataUrl: string;
  folder: UploadFolder;
  access?: UploadAccess;
  uploaderId: string;
  originalFileName?: string;
  allowedMimeTypes: readonly string[];
  maxSizeBytes: number;
}

function getUploadsBucket() {
  try {
    return getCloudflareContext().env[UPLOAD_BUCKET_BINDING] as R2Bucket | undefined;
  } catch {
    return undefined;
  }
}

function getAppBaseUrl() {
  return (process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "https://puntago.net").replace(
    /\/$/,
    "",
  );
}

function sanitizeFileName(fileName: string | undefined, fallback: string) {
  const cleaned = (fileName ?? fallback)
    .trim()
    .replace(/[^\w .()[\]-]/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 120);

  return cleaned || fallback;
}

function inferExtension(mimeType: string, originalFileName: string) {
  const fileExtension = originalFileName.split(".").pop()?.toLowerCase();

  if (fileExtension && /^[a-z0-9]{1,8}$/.test(fileExtension)) {
    return fileExtension;
  }

  return extensionByMimeType[mimeType] ?? "bin";
}

function decodeBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function parseDataUrl(dataUrl: string) {
  const match = /^data:([^;,]+);base64,([a-z0-9+/=\s]+)$/i.exec(dataUrl.trim());

  if (!match) {
    throw new StorageError("The file data format is invalid.");
  }

  const mimeType = match[1].toLowerCase();
  const bytes = decodeBase64(match[2].replace(/\s/g, ""));

  return {
    bytes,
    mimeType,
  };
}

export function buildUploadUrl(uploadId: string) {
  return `${getAppBaseUrl()}/api/uploads/${encodeURIComponent(uploadId)}`;
}

export async function uploadDataUrlToR2(params: UploadDataUrlParams) {
  const bucket = getUploadsBucket();

  if (!bucket) {
    throw new StorageError(
      "The R2 upload bucket is not connected. Check the PUNTAGO_UPLOADS_R2_BUCKET binding.",
    );
  }

  const { bytes, mimeType } = parseDataUrl(params.dataUrl);

  if (!params.allowedMimeTypes.includes(mimeType)) {
    throw new StorageError(`This file type is not allowed: ${mimeType}`);
  }

  if (bytes.byteLength > params.maxSizeBytes) {
    throw new StorageError(
      `Files must be ${(params.maxSizeBytes / 1_000_000).toFixed(1)}MB or smaller.`,
    );
  }

  const uploadId = crypto.randomUUID();
  const originalFileName = sanitizeFileName(
    params.originalFileName,
    `upload.${extensionByMimeType[mimeType] ?? "bin"}`,
  );
  const extension = inferExtension(mimeType, originalFileName);
  const folderPath = folderPathByFolder[params.folder];
  const datePrefix = new Date().toISOString().slice(0, 7).replace("-", "/");
  const objectKey = `${folderPath}/${datePrefix}/${uploadId}.${extension}`;
  const publicUrl = buildUploadUrl(uploadId);

  try {
    await bucket.put(objectKey, bytes, {
      httpMetadata: {
        contentDisposition: `inline; filename="${originalFileName.replace(/"/g, "")}"`,
        contentType: mimeType,
      },
    });
  } catch (error) {
    throw new StorageError(
      error instanceof Error ? `R2 upload failed: ${error.message}` : "R2 upload failed.",
    );
  }

  try {
    return await prisma.uploadedFile.create({
      data: {
        id: uploadId,
        bucket: UPLOAD_BUCKET_NAME,
        objectKey,
        publicUrl,
        folder: params.folder,
        access: params.access ?? UploadAccess.PRIVATE,
        originalFileName,
        mimeType,
        sizeBytes: bytes.byteLength,
        uploadedById: params.uploaderId,
      },
    });
  } catch (error) {
    await bucket.delete(objectKey).catch(() => null);
    throw new StorageError(
      error instanceof Error
        ? `Failed to save the upload record: ${error.message}`
        : "Failed to save the upload record.",
    );
  }
}

export async function getUploadedFileObject(objectKey: string) {
  const bucket = getUploadsBucket();

  if (!bucket) {
    throw new StorageError(
      "The R2 upload bucket is not connected. Check the PUNTAGO_UPLOADS_R2_BUCKET binding.",
    );
  }

  const object = await bucket.get(objectKey);

  if (!object) {
    throw new StorageError("The file was not found in R2.");
  }

  return object;
}

export async function deleteR2Object(objectKey: string) {
  const bucket = getUploadsBucket();

  if (!bucket) {
    return;
  }

  await bucket.delete(objectKey).catch(() => null);
}

export async function deleteUploadedFileByPublicUrl(publicUrl: string | null | undefined) {
  if (!publicUrl) {
    return;
  }

  const uploadedFile = await prisma.uploadedFile.findFirst({
    where: { publicUrl },
    select: {
      id: true,
      objectKey: true,
    },
  });

  if (!uploadedFile) {
    return;
  }

  await deleteR2Object(uploadedFile.objectKey);
  await prisma.uploadedFile.delete({ where: { id: uploadedFile.id } }).catch(() => null);
}
