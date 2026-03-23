import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().toLowerCase().min(2).regex(/^[a-z0-9-]+$/),
  client: z.string().trim().min(2),
  description: z.string().optional(),
  feedbackIntro: z.string().optional(),
  thankYouMessage: z.string().optional(),
  packageOptions: z.string().optional(),
  categoryOptions: z.string().optional(),
});

export const projectUpdateSchema = z.object({
  projectId: z.string().cuid(),
  slug: z.string().trim().toLowerCase().min(2).regex(/^[a-z0-9-]+$/),
  client: z.string().trim().min(2),
  description: z.string().optional(),
  feedbackIntro: z.string().optional(),
  thankYouMessage: z.string().optional(),
  packageOptions: z.string().optional(),
  categoryOptions: z.string().optional(),
});

export const emailSettingsSchema = z.object({
  subjectTemplate: z.string().min(5),
  bannerUrl: z.string().url(),
  trackerBannerUrl: z.string().url(),
  templateHtml: z.string().min(20),
});

export const userSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "PROJECT_REPRESENTATIVE", "VIEWER"]),
  addToAllProjects: z.enum(["YES", "NO"]).optional().default("NO"),
});

export const userUpdateSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().optional(),
  role: z.enum(["ADMIN", "PROJECT_REPRESENTATIVE", "VIEWER"]),
  addToAllProjects: z.enum(["YES", "NO"]).optional().default("NO"),
});

export const feedbackSchema = z.object({
  projectId: z.string().cuid(),
  client: z.string().trim().min(2),
  packageName: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  score: z.coerce.number().min(0).max(10),
  comment: z.string().optional().default(""),
  category: z.string().trim().min(2),
  contactRequested: z.enum(["YES", "NO"]),
});

export const trackerUpdateSchema = z.object({
  actionId: z.string().cuid(),
  contacted: z.coerce.boolean(),
  contactedAt: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) {
        return true;
      }

      const parsedDate = new Date(value);
      return !Number.isNaN(parsedDate.getTime()) && parsedDate <= new Date();
    }, "Action update date cannot be in the future."),
  ownerNotes: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]),
});
