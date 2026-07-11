import { z } from "zod";

const consentSchema = z.object({
  acceptedTerms: z.literal(true, {
    error: "You must agree to the Terms of Service.",
  }),
  acceptedPrivacy: z.literal(true, {
    error: "You must agree to the Privacy Policy.",
  }),
  acceptedPaymentPolicy: z.boolean().default(false),
  acceptedPlatformRole: z.literal(true, {
    error: "You must confirm that PuntaGo connects customers with independent service professionals.",
  }),
  acceptedProfessionalPolicy: z.boolean().default(false),
  acceptedMarketing: z.boolean().default(false),
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter a name with at least 2 characters.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phoneNumber: z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z
        .string()
        .trim()
        .regex(/^\+[1-9]\d{7,14}$/, "Enter the phone number with country code, such as +639171234567.")
        .optional(),
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password is too long."),
  role: z.enum(["customer", "tradesman"]),
  categorySlugs: z
    .array(z.string().trim().min(1))
    .max(12, "You can select up to 12 professional skill categories.")
    .default([]),
  consent: consentSchema,
  referralCode: z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z
        .string()
        .trim()
        .min(6, "Referral code must be at least 6 characters.")
        .max(32, "Referral code is too long.")
        .regex(/^[a-zA-Z0-9-]+$/, "Referral code can use only letters, numbers, and hyphens.")
        .optional(),
    ),
}).superRefine((value, context) => {
  if (value.role === "tradesman" && !value.consent.acceptedProfessionalPolicy) {
    context.addIssue({
      code: "custom",
      path: ["consent", "acceptedProfessionalPolicy"],
      message: "Professional registration requires agreement to the Professional Policy.",
    });
  }

  if (value.role === "tradesman" && value.categorySlugs.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["categorySlugs"],
      message: "Professional registration requires at least one service category.",
    });
  }
});

export const roleSelectionSchema = z.object({
  role: z.enum(["customer", "tradesman"]),
  consent: consentSchema,
}).superRefine((value, context) => {
  if (value.role === "tradesman" && !value.consent.acceptedProfessionalPolicy) {
    context.addIssue({
      code: "custom",
      path: ["consent", "acceptedProfessionalPolicy"],
      message: "Using PuntaGo as a professional requires agreement to the Professional Policy.",
    });
  }
});
