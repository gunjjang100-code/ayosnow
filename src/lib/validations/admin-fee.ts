import { z } from "zod";
import { optionalDateSchema, optionalIdSchema, optionalTextSchema } from "./_shared";

export const platformFeeScopeSchema = z.enum(["PLATFORM", "CATEGORY", "SERVICE"]);
export const platformFeeTypeSchema = z.enum(["PERCENTAGE", "FIXED"]);

const adminCommissionBaseSchema = z.object({
  name: z.string().trim().min(2, "수수료 이름은 2자 이상이어야 합니다.").max(80),
  scope: platformFeeScopeSchema,
  feeType: platformFeeTypeSchema,
  value: z.coerce.number().positive("수수료 값은 0보다 커야 합니다."),
  categoryId: optionalIdSchema("카테고리 ID를 입력해 주세요."),
  serviceId: optionalIdSchema("서비스 ID를 입력해 주세요."),
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
        message: "카테고리 수수료는 카테고리 ID가 필요합니다.",
        path: ["categoryId"],
      });
    }

    if (commissionValue.scope === "SERVICE" && !commissionValue.serviceId) {
      context.addIssue({
        code: "custom",
        message: "서비스 수수료는 서비스 ID가 필요합니다.",
        path: ["serviceId"],
      });
    }

    if (commissionValue.feeType === "PERCENTAGE" && (commissionValue.value ?? 0) > 100) {
      context.addIssue({
        code: "custom",
        message: "퍼센트 수수료는 100을 넘을 수 없습니다.",
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
        message: "종료일은 시작일보다 빠를 수 없습니다.",
        path: ["effectiveTo"],
      });
    }
  });

export const adminCommissionCreateSchema = validateCommissionRule(adminCommissionBaseSchema);

export const adminCommissionUpdateSchema = validateCommissionRule(
  adminCommissionBaseSchema.partial().extend({
    id: z.string().min(1, "수정할 수수료 ID가 필요합니다."),
  }),
);

export type AdminCommissionCreateInput = z.infer<typeof adminCommissionCreateSchema>;
export type AdminCommissionUpdateInput = z.infer<typeof adminCommissionUpdateSchema>;
