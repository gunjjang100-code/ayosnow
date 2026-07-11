import { UploadAccess, UploadFolder } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getUploadedFileObject, StorageError } from "@/lib/storage/r2-storage";
import type { UserRole } from "@/lib/types";

async function canReadUploadedFile(params: {
  uploadId: string;
  userId: string;
  userRole: UserRole;
  uploadedById: string;
  folder: UploadFolder;
}) {
  if (isAdmin(params.userRole)) {
    return true;
  }

  if (params.uploadedById === params.userId) {
    return true;
  }

  if (params.folder !== UploadFolder.CHAT) {
    return false;
  }

  const linkedChatMessage = await prisma.message.findFirst({
    where: {
      OR: [{ imageUploadId: params.uploadId }, { fileUploadId: params.uploadId }],
      conversation: {
        OR: [{ customerId: params.userId }, { tradesmanId: params.userId }],
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(linkedChatMessage);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const uploadedFile = await prisma.uploadedFile.findUnique({
    where: {
      id,
    },
  });

  if (!uploadedFile) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  if (uploadedFile.access !== UploadAccess.PUBLIC) {
    const sessionUser = await getRequestSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const allowed = await canReadUploadedFile({
      uploadId: uploadedFile.id,
      userId: sessionUser.id,
      userRole: sessionUser.role,
      uploadedById: uploadedFile.uploadedById,
      folder: uploadedFile.folder,
    });

    if (!allowed) {
      return NextResponse.json({ error: "You do not have permission to access this file." }, { status: 403 });
    }
  }

  try {
    const object = await getUploadedFileObject(uploadedFile.objectKey);

    return new Response(object.body, {
      headers: {
        "Cache-Control":
          uploadedFile.access === UploadAccess.PUBLIC
            ? "public, max-age=31536000, immutable"
            : "private, max-age=60",
        "Content-Disposition": `inline; filename="${uploadedFile.originalFileName.replace(/"/g, "")}"`,
        "Content-Length": String(uploadedFile.sizeBytes),
        "Content-Type": uploadedFile.mimeType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof StorageError
            ? error.message
            : "Could not load the file.",
      },
      { status: 502 },
    );
  }
}
