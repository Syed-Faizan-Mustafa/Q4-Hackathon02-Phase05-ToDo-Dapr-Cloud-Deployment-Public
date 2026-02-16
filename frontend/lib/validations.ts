import { z } from 'zod';

// Password validation per clarification (8+ chars, uppercase, lowercase, number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');

// Auth schemas
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Task schemas - Phase 5 Part A enhanced
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  tags: z.array(z.string().max(30)).max(10).default([]),
  dueDate: z.string().optional().or(z.literal('')),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(['daily', 'weekly', 'monthly']).nullable().default(null),
  recurrenceInterval: z.number().min(1).default(1),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  completed: z.boolean().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  dueDate: z.string().optional().or(z.literal('')),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(['daily', 'weekly', 'monthly']).nullable().optional(),
  recurrenceInterval: z.number().min(1).optional(),
});

// Type inference
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;
