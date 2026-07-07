import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email('Saisis un email valide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(1, 'Le nom est requis').max(80, 'Le nom est trop long'),
});

export const authFormSchema = loginSchema.extend({
  name: z.string().max(80, 'Le nom est trop long').optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type AuthFormData = z.infer<typeof authFormSchema>;
