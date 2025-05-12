import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model (admin and teachers)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "teacher"] }).default("teacher").notNull(),
  assignedClasses: json("assigned_classes").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Student model
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  class: text("class", { enum: ["Nursery", "LKG", "UKG"] }).notNull(),
  parentContact: text("parent_contact"),
  learningAbility: text("learning_ability", { enum: ["Talented", "Average", "Slow Learner"] }).notNull(),
  writingSpeed: text("writing_speed", { enum: ["Speed Writing", "Slow Writing", "N/A"] }).notNull(),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  photoPublicId: text("photo_public_id"),
  teacherId: integer("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

// Progress model
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  socialSkills: text("social_skills", { enum: ["Excellent", "Good", "Needs Improvement"] }).notNull(),
  preLiteracy: text("pre_literacy", { enum: ["Excellent", "Good", "Needs Improvement"] }).notNull(),
  preNumeracy: text("pre_numeracy", { enum: ["Excellent", "Good", "Needs Improvement"] }).notNull(),
  motorSkills: text("motor_skills", { enum: ["Excellent", "Good", "Needs Improvement"] }).notNull(),
  emotionalDev: text("emotional_dev", { enum: ["Excellent", "Good", "Needs Improvement"] }).notNull(),
  comments: text("comments"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
});

export const insertProgressSchema = createInsertSchema(progress).omit({
  id: true,
});

// Teaching Plan model
export const teachingPlans = pgTable("teaching_plans", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["Annual", "Monthly", "Weekly"] }).notNull(),
  class: text("class", { enum: ["Nursery", "LKG", "UKG"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  activities: text("activities").notNull(),
  goals: text("goals").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTeachingPlanSchema = createInsertSchema(teachingPlans).omit({
  id: true,
  createdAt: true,
});

// AI Suggestions model (for caching)
export const aiSuggestions = pgTable("ai_suggestions", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Progress = typeof progress.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;

export type TeachingPlan = typeof teachingPlans.$inferSelect;
export type InsertTeachingPlan = z.infer<typeof insertTeachingPlanSchema>;

export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;

// Extended schemas with validation
export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(5, { message: "Password must be at least 5 characters" }),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
