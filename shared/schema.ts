import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (teachers and admin)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("teacher"), // "admin" or "teacher"
  name: text("name").notNull(),
  assignedClasses: text("assigned_classes").array(), // "Nursery", "LKG", "UKG"
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Student schema
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(), // 3-5 years
  class: text("class").notNull(), // "Nursery", "LKG", "UKG"
  parentContact: text("parent_contact"),
  learningAbility: text("learning_ability").notNull(), // "Talented", "Average", "Slow Learner"
  writingSpeed: text("writing_speed"), // "Slow Writing", "Speed Writing", null for Nursery
  notes: text("notes"),
  photoUrl: text("photo_url"),
  teacherId: integer("teacher_id").notNull(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

// Progress tracking schema
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  date: date("date").notNull().defaultNow(),
  socialSkills: text("social_skills").notNull(), // "Excellent", "Good", "Needs Improvement"
  preLiteracy: text("pre_literacy").notNull(), // "Excellent", "Good", "Needs Improvement"
  preNumeracy: text("pre_numeracy").notNull(), // "Excellent", "Good", "Needs Improvement"
  motorSkills: text("motor_skills").notNull(), // "Excellent", "Good", "Needs Improvement"
  emotionalDevelopment: text("emotional_development").notNull(), // "Excellent", "Good", "Needs Improvement"
  comments: text("comments"),
});

export const insertProgressSchema = createInsertSchema(progress).omit({
  id: true,
});

// Teaching plans schema
export const teachingPlans = pgTable("teaching_plans", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "Annual", "Monthly", "Weekly"
  class: text("class").notNull(), // "Nursery", "LKG", "UKG"
  title: text("title").notNull(),
  description: text("description").notNull(),
  activities: text("activities").notNull(),
  goals: text("goals").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdBy: integer("created_by").notNull(), // teacher/admin ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTeachingPlanSchema = createInsertSchema(teachingPlans).omit({
  id: true,
  createdAt: true,
});

// Define enums for validation
export const ClassLevel = z.enum(["Nursery", "LKG", "UKG"]);
export const LearningAbility = z.enum(["Talented", "Average", "Slow Learner"]);
export const WritingSpeed = z.enum(["Slow Writing", "Speed Writing"]);
export const ProgressRating = z.enum(["Excellent", "Good", "Needs Improvement"]);
export const PlanType = z.enum(["Annual", "Monthly", "Weekly"]);
export const UserRole = z.enum(["admin", "teacher"]);

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Progress = typeof progress.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;

export type TeachingPlan = typeof teachingPlans.$inferSelect;
export type InsertTeachingPlan = z.infer<typeof insertTeachingPlanSchema>;
