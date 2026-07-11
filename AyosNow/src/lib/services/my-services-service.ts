import { UserRole } from "@prisma/client";

import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma";
import type { ManagedServiceItem, UserRole as AppUserRole } from "@/lib/types";

export interface ManagedServiceInput {
  title: string;
  location: string;
  priceLabel: string;
  arrival: string;
  tags: string[];
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || "service";
}

function parsePriceRange(priceLabel: string) {
  const numbers = priceLabel
    .match(/\d[\d,]*/g)
    ?.map((value) => Number(value.replaceAll(",", "")))
    .filter((value) => Number.isFinite(value) && value >= 0) ?? [];

  const min = numbers[0] ?? 100;
  const max = numbers[1] ?? min;

  return {
    min: Math.max(100, Math.min(min, max)),
    max: Math.max(100, Math.max(min, max)),
  };
}

function serializeTags(tags: string[]) {
  return tags.map((tag) => tag.trim()).filter(Boolean).join(",");
}

function parseStoredTags(tags: string) {
  return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
}

async function getDefaultServiceCategory() {
  const existingCategory = await prisma.serviceCategory.findFirst({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  if (existingCategory) {
    return existingCategory;
  }

  // 운영 초기 DB에 카테고리가 아직 없어도 전문가가 서비스를 저장할 수 있게
  // 가장 기본 카테고리 하나를 서버에서 만들어 둔다.
  return prisma.serviceCategory.upsert({
    where: { slug: "general-services" },
    update: { isActive: true },
    create: {
      slug: "general-services",
      name: "General Services",
      description: "Default service category used until admin categories are finalized.",
      isActive: true,
      displayOrder: 999,
    },
  });
}

async function buildUniqueServiceSlug(title: string, ownerId: string, currentId?: string) {
  const baseSlug = `${slugify(title)}-${ownerId.slice(-6)}`;
  let candidate = baseSlug;
  let index = 2;

  while (true) {
    const existing = await prisma.service.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === currentId) {
      return candidate;
    }

    candidate = `${baseSlug}-${index}`;
    index += 1;
  }
}

function formatPhpRange(min: number, max: number) {
  return `PHP ${Math.round(Number(min)).toLocaleString("en-PH")} ~ ${Math.round(Number(max)).toLocaleString("en-PH")}`;
}

function toManagedServiceItem(service: {
  id: string;
  slug: string;
  title: string;
  serviceArea: string | null;
  basePriceMin: number;
  basePriceMax: number;
  shortDescription: string;
  tags: string;
  isPublished: boolean;
  owner: {
    city: string | null;
  };
}): ManagedServiceItem {
  return {
    id: service.id,
    slug: service.slug,
    title: service.title,
    location: service.serviceArea ?? service.owner.city ?? "Service area flexible",
    priceLabel: formatPhpRange(service.basePriceMin, service.basePriceMax),
    arrival: service.shortDescription,
    tags: parseStoredTags(service.tags),
    isActive: service.isPublished,
  };
}

function assertManageServicesRole(role: AppUserRole) {
  if (role !== "tradesman") {
    throw new AppError("Only professional accounts can update services.", 403);
  }
}

async function assertServiceOwner(params: {
  serviceId: string;
  userId: string;
}) {
  const service = await prisma.service.findUnique({
    where: { id: params.serviceId },
    select: { id: true, ownerId: true },
  });

  if (!service) {
    throw new AppError("Could not find the service to update.", 404);
  }

  if (service.ownerId !== params.userId) {
    throw new AppError("You can only update your own services.", 403);
  }
}

export async function listManagedServicesForUser(params: {
  userId: string;
  role: AppUserRole;
}) {
  const services = await prisma.service.findMany({
    where:
      params.role === "admin"
        ? {}
        : {
            ownerId: params.userId,
          },
    include: {
      owner: {
        select: {
          city: true,
        },
      },
    },
    orderBy: [{ isPublished: "desc" }, { updatedAt: "desc" }],
  });

  return services.map(toManagedServiceItem);
}

export async function createManagedService(params: {
  userId: string;
  role: AppUserRole;
  input: ManagedServiceInput;
}) {
  assertManageServicesRole(params.role);

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { role: true },
  });

  if (!user || user.role !== UserRole.TRADESMAN) {
    throw new AppError("Only professional accounts can create services.", 403);
  }

  const category = await getDefaultServiceCategory();
  const price = parsePriceRange(params.input.priceLabel);
  const slug = await buildUniqueServiceSlug(params.input.title, params.userId);

  const service = await prisma.service.create({
    data: {
      ownerId: params.userId,
      categoryId: category.id,
      slug,
      title: params.input.title,
      shortDescription: params.input.arrival,
      basePriceMin: price.min,
      basePriceMax: price.max,
      serviceArea: params.input.location,
      tags: serializeTags(params.input.tags),
      durationMinutes: 120,
      isPublished: true,
    },
    include: {
      owner: {
        select: {
          city: true,
        },
      },
    },
  });

  return toManagedServiceItem(service);
}

export async function updateManagedService(params: {
  serviceId: string;
  userId: string;
  role: AppUserRole;
  input: ManagedServiceInput;
}) {
  assertManageServicesRole(params.role);
  await assertServiceOwner({
    serviceId: params.serviceId,
    userId: params.userId,
  });

  const price = parsePriceRange(params.input.priceLabel);
  const slug = await buildUniqueServiceSlug(
    params.input.title,
    params.userId,
    params.serviceId,
  );

  const service = await prisma.service.update({
    where: { id: params.serviceId },
    data: {
      slug,
      title: params.input.title,
      shortDescription: params.input.arrival,
      basePriceMin: price.min,
      basePriceMax: price.max,
      serviceArea: params.input.location,
      tags: serializeTags(params.input.tags),
    },
    include: {
      owner: {
        select: {
          city: true,
        },
      },
    },
  });

  return toManagedServiceItem(service);
}

export async function setManagedServicePublished(params: {
  serviceId: string;
  userId: string;
  role: AppUserRole;
  isPublished: boolean;
}) {
  assertManageServicesRole(params.role);
  await assertServiceOwner({
    serviceId: params.serviceId,
    userId: params.userId,
  });

  const service = await prisma.service.update({
    where: { id: params.serviceId },
    data: {
      isPublished: params.isPublished,
    },
    include: {
      owner: {
        select: {
          city: true,
        },
      },
    },
  });

  return toManagedServiceItem(service);
}
