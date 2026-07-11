import { z } from "zod";
import { optionalDateSchema, optionalIdSchema, optionalTextSchema } from "./_shared";

export const platformFeeScopeSchema = z.enum(["PLATFORM", "CATEGORY", "SERVICE"]);
export const platformFeeTypeSchema = z.enum(["PERCENTAGE", "FIXED"]);

const adminCommissionBaseSchema = z.object({
  name: z.string().trim().min(2, "Fee name must be at least 2 characters.").max(80),
  scope: platformFeeScopeSchema,
  feeType: platformFeeTypeSchema,
  value: z.coerce.number().positive("Fee value must be greater than 0."),
  categoryId: optionalIdSchema("Category ID is required."),
  serviceId: optionalIdSchema("Service ID is required."),
  isActive: z.boolean().default(true),
  effectiveFrom: optionalDateSchema(),
  effectiveTo: optionalDateSchema(),
  note: optionalTextSchema(300),
});

const validateCommissionRule = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((value, context) => {
    const commissionValue = value as {
      categoryId?: string;
      effectiveFrom?: Date;
      effectiveTo?: Date;
      feeType?: "PERCENTAGE" | "FIXED";
      scope?: "PLATFORM" | "CATEGORY" | "SERVICE";
      serviceId?: string;
      value?: number;
    };

    if (commissionValue.scope === "CATEGORY" && !commissionValue.categoryId) {
      context.addIssue({
        code: "custom",
        message: "Category fees require a category ID.",
        path: ["categoryId"],
      });
    }

    if (commissionValue.scope === "SERVICE" && !commissionValue.serviceId) {
      context.addIssue({
        code: "custom",
        message: "Service fees require a service ID.",
        path: ["serviceId"],
      });
    }

    if (commissionValue.feeType === "PERCENTAGE" && (commissionValue.value ?? 0) > 100) {
      context.addIssue({
        code: "custom",
        message: "Percentage fees cannot exceed 100.",
        path: ["value"],
      });
    }

    if (
      commissionValue.effectiveFrom &&
      commissionValue.effectiveTo &&
      commissionValue.effectiveTo < commissionValue.effectiveFrom
    ) {
      context.addIssue({
        code: "custom",
        message: "End date cannot be earlier than start date.",
        path: ["effectiveTo"],
      });
    }
  });

export const adminCommissionCreateSchema = validateCommissionRule(adminCommissionBaseSchema);

export const adminCommissionUpdateSchema = validateCommissionRule(
  adminCommissionBaseSchema.partial().extend({
    id: z.string().min(1, "Fee ID is required for updates."),
  }),
);

export type AdminCommissionCreateInput = z.infer<typeof adminCommissionCreateSchema>;
export type AdminCommissionUpdateInput = z.infer<typeof adminCommissionUpdateSchema>;
