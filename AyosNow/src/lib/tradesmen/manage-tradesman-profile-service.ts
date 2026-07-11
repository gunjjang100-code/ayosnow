import { UploadAccess, UploadFolder, UserRole } from "@prisma/client";

import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma";
import { getVisibleProfessionalBadgesForProfiles } from "@/lib/professional-badges/professional-badge-service";
import {
  CHAT_IMAGE_MIME_TYPES,
  CHAT_UPLOAD_MAX_BYTES,
  deleteUploadedFileByPublicUrl,
  uploadDataUrlToR2,
} from "@/lib/storage/r2-storage";
import {
  normalizeTradesmanProfileBio,
  normalizeTradesmanProfileHeadline,
} from "@/lib/tradesmen/profile-text";
import type { ProfessionalBadgeSummary } from "@/lib/types";

export interface TradesmanProfileEditorData {
  avatarUrl: string | null;
  headline: string;
  bio: string;
  experienceYears: number;
  serviceRadiusKm: number;
  badges: ProfessionalBadgeSummary[];
  portfolio: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
  }>;
  certifications: Array<{
    id: string;
    title: string;
    issuer: string | null;
    acquiredAt: string | null;
    expiresAt: string | null;
    fileUrl: string | null;
  }>;
}

export interface UpdateTradesmanProfileInput {
  headline: string;
  bio: string;
  experienceYears: number;
  serviceRadiusKm: number;
  avatarDataUrl?: string;
  avatarFileName?: string;
}

export interface AddTradesmanPortfolioInput {
  title: string;
  description: string;
  imageDataUrl: string;
  imageFileName?: string;
}

export interface UpdateTradesmanPortfolioInput {
  title: string;
  description: string;
  imageDataUrl?: string;
  imageFileName?: string;
}

export interface ManageTradesmanCertificationInput {
  title: string;
  issuer?: string;
  acquiredAt?: string;
  expiresAt?: string;
  fileDataUrl?: string;
  fileName?: string;
}

function toDate(value: string | undefined) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function toIsoDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

async function getTradesmanUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      fullName: true,
      avatarUrl: true,
      tradesmanProfile: {
        include: {
          portfolioItems: {
            orderBy: { createdAt: "desc" },
            take: 12,
          },
          certifications: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (user.role !== UserRole.TRADESMAN) {
    throw new AppError("Only professional accounts can edit a professional profile.", 403);
  }

  return user;
}

async function ensureTradesmanProfile(userId: string) {
  const existingProfile = await prisma.tradesmanProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    return existingProfile;
  }

  return prisma.tradesmanProfile.create({
    data: {
      userId,
      headline: "Trusted service professional",
      bio: "Tell customers about your experience, service style, and the jobs you handle best.",
      experienceYears: 1,
      serviceRadiusKm: 10,
    },
  });
}

export async function getTradesmanProfileEditorData(
  userId: string,
): Promise<TradesmanProfileEditorData> {
  const user = await getTradesmanUser(userId);
  const profile = user.tradesmanProfile ?? (await ensureTradesmanProfile(userId));
  const badgeMap = await getVisibleProfessionalBadgesForProfiles([profile.id]);

  return {
    avatarUrl: user.avatarUrl,
    headline: normalizeTradesmanProfileHeadline({
      headline: profile.headline,
      fullName: user.fullName,
    }),
    bio: normalizeTradesmanProfileBio(profile.bio),
    experienceYears: profile.experienceYears,
    serviceRadiusKm: profile.serviceRadiusKm,
    badges: badgeMap.get(profile.id) ?? [],
    portfolio: (user.tradesmanProfile?.portfolioItems ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
    })),
    certifications: (user.tradesmanProfile?.certifications ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      issuer: item.issuer,
      acquiredAt: toIsoDate(item.acquiredAt),
      expiresAt: toIsoDate(item.expiresAt),
      fileUrl: item.fileUrl,
    })),
  };
}

export async function updateTradesmanProfile(params: {
  userId: string;
  input: UpdateTradesmanProfileInput;
}) {
  await getTradesmanUser(params.userId);
  await ensureTradesmanProfile(params.userId);

  let avatarUrl: string | undefined;

  if (params.input.avatarDataUrl) {
    const uploadedAvatar = await uploadDataUrlToR2({
      dataUrl: params.input.avatarDataUrl,
      folder: UploadFolder.PROFILE,
      access: UploadAccess.PUBLIC,
      uploaderId: params.userId,
      originalFileName: params.input.avatarFileName,
      allowedMimeTypes: CHAT_IMAGE_MIME_TYPES,
      maxSizeBytes: CHAT_UPLOAD_MAX_BYTES,
    });

    avatarUrl = uploadedAvatar.publicUrl;
  }

  const [profile, user] = await Promise.all([
    prisma.tradesmanProfile.update({
      where: { userId: params.userId },
      data: {
        headline: params.input.headline,
        bio: params.input.bio,
        experienceYears: params.input.experienceYears,
        serviceRadiusKm: params.input.serviceRadiusKm,
      },
    }),
    avatarUrl
      ? prisma.user.update({
          where: { id: params.userId },
          data: { avatarUrl },
          select: { avatarUrl: true },
        })
      : prisma.user.findUnique({
          where: { id: params.userId },
          select: { avatarUrl: true },
        }),
  ]);

  return {
    avatarUrl: user?.avatarUrl ?? null,
    headline: profile.headline,
    bio: profile.bio,
    experienceYears: profile.experienceYears,
    serviceRadiusKm: profile.serviceRadiusKm,
  };
}

export async function addTradesmanPortfolioItem(params: {
  userId: string;
  input: AddTradesmanPortfolioInput;
}) {
  await getTradesmanUser(params.userId);
  const profile = await ensureTradesmanProfile(params.userId);

  const uploadedImage = await uploadDataUrlToR2({
    dataUrl: params.input.imageDataUrl,
    folder: UploadFolder.PORTFOLIO,
    access: UploadAccess.PUBLIC,
    uploaderId: params.userId,
    originalFileName: params.input.imageFileName,
    allowedMimeTypes: CHAT_IMAGE_MIME_TYPES,
    maxSizeBytes: CHAT_UPLOAD_MAX_BYTES,
  });

  return prisma.portfolioItem.create({
    data: {
      profileId: profile.id,
      title: params.input.title,
      description: params.input.description,
      imageUrl: uploadedImage.publicUrl,
    },
  });
}

async function getOwnedPortfolioItem(userId: string, portfolioItemId: string) {
  const portfolioItem = await prisma.portfolioItem.findFirst({
    where: {
      id: portfolioItemId,
      profile: {
        userId,
      },
    },
  });

  if (!portfolioItem) {
    throw new AppError("Portfolio photo not found.", 404);
  }

  return portfolioItem;
}

export async function updateTradesmanPortfolioItem(params: {
  userId: string;
  portfolioItemId: string;
  input: UpdateTradesmanPortfolioInput;
}) {
  await getTradesmanUser(params.userId);
  const currentItem = await getOwnedPortfolioItem(params.userId, params.portfolioItemId);
  let imageUrl: string | undefined;

  if (params.input.imageDataUrl) {
    const uploadedImage = await uploadDataUrlToR2({
      dataUrl: params.input.imageDataUrl,
      folder: UploadFolder.PORTFOLIO,
      access: UploadAccess.PUBLIC,
      uploaderId: params.userId,
      originalFileName: params.input.imageFileName,
      allowedMimeTypes: CHAT_IMAGE_MIME_TYPES,
      maxSizeBytes: CHAT_UPLOAD_MAX_BYTES,
    });

    imageUrl = uploadedImage.publicUrl;
  }

  const updatedItem = await prisma.portfolioItem.update({
    where: { id: params.portfolioItemId },
    data: {
      title: params.input.title,
      description: params.input.description,
      ...(imageUrl ? { imageUrl } : {}),
    },
  });

  if (imageUrl) {
    await deleteUploadedFileByPublicUrl(currentItem.imageUrl);
  }

  return updatedItem;
}

export async function deleteTradesmanPortfolioItem(params: {
  userId: string;
  portfolioItemId: string;
}) {
  await getTradesmanUser(params.userId);
  const currentItem = await getOwnedPortfolioItem(params.userId, params.portfolioItemId);

  await prisma.portfolioItem.delete({
    where: { id: params.portfolioItemId },
  });
  await deleteUploadedFileByPublicUrl(currentItem.imageUrl);
}

async function uploadCertificationFile(params: {
  userId: string;
  fileDataUrl?: string;
  fileName?: string;
}) {
  if (!params.fileDataUrl) {
    return undefined;
  }

  const uploadedFile = await uploadDataUrlToR2({
    dataUrl: params.fileDataUrl,
    folder: UploadFolder.DOCUMENTS,
    access: UploadAccess.PUBLIC,
    uploaderId: params.userId,
    originalFileName: params.fileName,
    allowedMimeTypes: CHAT_IMAGE_MIME_TYPES,
    maxSizeBytes: CHAT_UPLOAD_MAX_BYTES,
  });

  return uploadedFile.publicUrl;
}

async function getOwnedCertification(userId: string, certificationId: string) {
  const certification = await prisma.certification.findFirst({
    where: {
      id: certificationId,
      profile: {
        userId,
      },
    },
  });

  if (!certification) {
    throw new AppError("Certificate not found.", 404);
  }

  return certification;
}

export async function addTradesmanCertification(params: {
  userId: string;
  input: ManageTradesmanCertificationInput;
}) {
  await getTradesmanUser(params.userId);
  const profile = await ensureTradesmanProfile(params.userId);
  const fileUrl = await uploadCertificationFile({
    userId: params.userId,
    fileDataUrl: params.input.fileDataUrl,
    fileName: params.input.fileName,
  });

  const certification = await prisma.certification.create({
    data: {
      profileId: profile.id,
      title: params.input.title,
      issuer: params.input.issuer,
      acquiredAt: toDate(params.input.acquiredAt),
      expiresAt: toDate(params.input.expiresAt),
      fileUrl,
    },
  });

  return {
    id: certification.id,
    title: certification.title,
    issuer: certification.issuer,
    acquiredAt: toIsoDate(certification.acquiredAt),
    expiresAt: toIsoDate(certification.expiresAt),
    fileUrl: certification.fileUrl,
  };
}

export async function updateTradesmanCertification(params: {
  userId: string;
  certificationId: string;
  input: ManageTradesmanCertificationInput;
}) {
  await getTradesmanUser(params.userId);
  const currentCertification = await getOwnedCertification(
    params.userId,
    params.certificationId,
  );
  const fileUrl = await uploadCertificationFile({
    userId: params.userId,
    fileDataUrl: params.input.fileDataUrl,
    fileName: params.input.fileName,
  });

  const certification = await prisma.certification.update({
    where: { id: params.certificationId },
    data: {
      title: params.input.title,
      issuer: params.input.issuer,
      acquiredAt: toDate(params.input.acquiredAt),
      expiresAt: toDate(params.input.expiresAt),
      ...(fileUrl ? { fileUrl } : {}),
    },
  });

  if (fileUrl) {
    await deleteUploadedFileByPublicUrl(currentCertification.fileUrl);
  }

  return {
    id: certification.id,
    title: certification.title,
    issuer: certification.issuer,
    acquiredAt: toIsoDate(certification.acquiredAt),
    expiresAt: toIsoDate(certification.expiresAt),
    fileUrl: certification.fileUrl,
  };
}

export async function deleteTradesmanCertification(params: {
  userId: string;
  certificationId: string;
}) {
  await getTradesmanUser(params.userId);
  const certification = await getOwnedCertification(params.userId, params.certificationId);

  await prisma.certification.delete({
    where: { id: params.certificationId },
  });
  await deleteUploadedFileByPublicUrl(certification.fileUrl);
}
