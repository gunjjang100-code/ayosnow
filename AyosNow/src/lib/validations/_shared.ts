import { z } from "zod";

const emptyStringToUndefined = (value: unknown) => (value === "" ? undefined : value);

const startsWithAllowedPrefix = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");

export const requiredUrlOrPathSchema = (requiredMessage: string, invalidMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .max(500)
    .refine(startsWithAllowedPrefix, invalidMessage);

export const optionalUrlOrPathSchema = (invalidMessage: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .trim()
      .max(500)
      .refine(startsWithAllowedPrefix, invalidMessage)
      .optional(),
  );

export const optionalTextSchema = (max: number, message?: string) =>
  z.preprocess(
    emptyStringToUndefined,
    message ? z.string().trim().max(max, message).optional() : z.string().trim().max(max).optional(),
  );

export const optionalIdSchema = (message: string) =>
  z.preprocess(emptyStringToUndefined, z.string().min(1, message).optional());

export const optionalDateSchema = () => z.preprocess(emptyStringToUndefined, z.coerce.date().optional());
