import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "이름은 2자 이상 입력해 주세요.").max(80),
  email: z.string().trim().toLowerCase().email("올바른 이메일을 입력해 주세요."),
  phoneNumber: z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z
        .string()
        .trim()
        .regex(/^\+[1-9]\d{7,14}$/, "전화번호는 +639171234567처럼 국가번호를 포함해 입력해 주세요.")
        .optional(),
    ),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다.")
    .max(100, "비밀번호가 너무 깁니다."),
  role: z.enum(["customer", "tradesman"]),
});

export const roleSelectionSchema = z.object({
  role: z.enum(["customer", "tradesman"]),
});
