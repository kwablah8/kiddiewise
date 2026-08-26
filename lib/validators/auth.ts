import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Presentational for now, see the note in app/(auth)/login/page.tsx. It lives in the schema
  // rather than as loose component state so that wiring it up later is a change to the submit
  // handler alone, not to the form's shape.
  remember: z.boolean(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
