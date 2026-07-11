import { z } from "zod";

const dataImageUrlPattern = /^data:image\/(png|jpe?g|webp|gif);base64,/i;

const optionalImageDataUrlSchema = z
  .string()
  .trim()
  .max(3_500_000, "Image data is too large.")
  .refine(
    (value) => value.length === 0 || dataImageUrlPattern.test(value),
    "Image format is invalid.",
  )
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalFileNameSchema = z
  .string()
  .trim()
  .max(120, "Filename is too long.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const updateTradesmanProfileSchema = z.object({
  headline: z.string().trim().min(5, "Headline must be at least 5 characters.").max(120),
  bio: z.string().trim().min(20, "Bio must be at least 20 characters.").max(1000),
  experienceYears: z.coerce
    .number()
    .int("Experience must be a whole number.")
    .min(0, "Experience cannot be lower than 0.")
    .max(60, "Experience is too high."),
  serviceRadiusKm: z.coerce
    .number()
    .int("Service radius must be a whole number.")
    .min(1, "Service radius must be at least 1 km.")
    .max(100, "Service radius cannot exceed 100 km."),
  avatarDataUrl: optionalImageDataUrlSchema,
  avatarFileName: optionalFileNameSchema,
});

export const addTradesmanPortfolioSchema = z.object({
  title: z.string().trim().min(3, "Portfolio title must be at least 3 characters.").max(100),
  description: z
    .string()
    .trim()
    .min(10, "Portfolio description must be at least 10 characters.")
    .max(500),
  imageDataUrl: z
    .string()
    .trim()
    .max(3_500_000, "Image data is too large.")
    .refine((value) => dataImageUrlPattern.test(value), "Image format is invalid."),
  imageFileName: optionalFileNameSchema,
});

export const updateTradesmanPortfolioSchema = z.object({
  title: z.string().trim().min(3, "Portfolio title must be at least 3 characters.").max(100),
  description: z
    .string()
    .trim()
    .min(10, "Portfolio description must be at least 10 characters.")
    .max(500),
  imageDataUrl: optionalImageDataUrlSchema,
  imageFileName: optionalFileNameSchema,
});

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .refine(
    (value) => !value || !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()),
    "Date is invalid.",
  );

export const addTradesmanCertificationSchema = z.object({
  title: z.string().trim().min(3, "Certificate title must be at least 3 characters.").max(120),
  issuer: z
    .string()
    .trim()
    .max(120, "Issuer is too long.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  acquiredAt: optionalDateSchema,
  expiresAt: optionalDateSchema,
  fileDataUrl: optionalImageDataUrlSchema,
  fileName: optionalFileNameSchema,
});

export const updateTradesmanCertificationSchema = addTradesmanCertificationSchema;
