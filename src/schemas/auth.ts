import { z } from 'zod'
import { currencySchema } from './common'

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  currency: currencySchema.default('USD'),
})

export type SignUpInput = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type SignInInput = z.infer<typeof signInSchema>

export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  currency: currencySchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type UserResponse = z.infer<typeof userResponseSchema>

export const sessionResponseSchema = z.object({
  user: userResponseSchema,
  session: z.object({
    id: z.string(),
    expiresAt: z.string().datetime(),
  }),
})

export type SessionResponse = z.infer<typeof sessionResponseSchema>

// Contract aliases
export const SignUpInputSchema = signUpSchema
export const SignInInputSchema = signInSchema
export const AuthSessionResponseSchema = sessionResponseSchema
