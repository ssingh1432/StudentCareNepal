import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (admins and teachers)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("teacher"),
  assignedClasses: json("assigned_classes").$type<string[]>().notNull().default(['Nursery']),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  assignedClasses: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Student schema
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  class: text("class").notNull(),
  parentContact: text("parent_contact"),
  learningAbility: text("learning_ability").notNull(),
  writingSpeed: text("writing_speed"),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  photoPublicId: text("photo_public_id"),
  teacherId: integer("teacher_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).pick({
  name: true,
  age: true,
  class: true,
  parentContact: true,
  learningAbility: true,
  writingSpeed: true,
  notes: true,
  photoUrl: true,
  photoPublicId: true,
  teacherId: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Progress tracking schema
export const progressEntries = pgTable("progress_entries", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  socialSkills: text("social_skills").notNull(),
  preLiteracy: text("pre_literacy").notNull(),
  preNumeracy: text("pre_numeracy").notNull(),
  motorSkills: text("motor_skills").notNull(),
  emotionalDevelopment: text("emotional_development").notNull(),
  comments: text("comments"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProgressEntrySchema = createInsertSchema(progressEntries).pick({
  studentId: true,
  date: true,
  socialSkills: true,
  preLiteracy: true,
  preNumeracy: true,
  motorSkills: true,
  emotionalDevelopment: true,
  comments: true,
  createdBy: true,
});

export type InsertProgressEntry = z.infer<typeof insertProgressEntrySchema>;
export type ProgressEntry = typeof progressEntries.$inferSelect;

// Teaching plans schema
export const teachingPlans = pgTable("teaching_plans", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  class: text("class").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  activities: text("activities").notNull(),
  goals: text("goals").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTeachingPlanSchema = createInsertSchema(teachingPlans).pick({
  type: true,
  class: true,
  title: true,
  description: true,
  activities: true,
  goals: true,
  startDate: true,
  endDate: true,
  createdBy: true,
});

export type InsertTeachingPlan = z.infer<typeof insertTeachingPlanSchema>;
export type TeachingPlan = typeof teachingPlans.$inferSelect;

// For DeepSeek AI suggestions caching
export const aiSuggestions = pgTable("ai_suggestions", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).pick({
  prompt: true,
  response: true,
});

export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;
export type AiSuggestion = typeof aiSuggestions.$inferSelect;

// Predefined values for various fields
export const classOptions = ["Nursery", "LKG", "UKG"] as const;
export const learningAbilityOptions = ["Talented", "Average", "Slow Learner"] as const;
export const writingSpeedOptions = ["Speed Writing", "Slow Writing", "N/A"] as const;
export const progressRatingOptions = ["Excellent", "Good", "Needs Improvement"] as const;
export const planTypeOptions = ["Annual", "Monthly", "Weekly"] as const;

// Validation schemas with these options
export const classValidation = z.enum(classOptions);
export const learningAbilityValidation = z.enum(learningAbilityOptions);
export const writingSpeedValidation = z.enum(writingSpeedOptions);
export const progressRatingValidation = z.enum(progressRatingOptions);
export const planTypeValidation = z.enum(planTypeOptions);
