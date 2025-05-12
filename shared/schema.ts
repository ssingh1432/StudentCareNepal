import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for the schema
export const roleEnum = pgEnum('role', ['admin', 'teacher']);
export const classEnum = pgEnum('class', ['Nursery', 'LKG', 'UKG']);
export const learningAbilityEnum = pgEnum('learning_ability', ['Talented', 'Average', 'Slow Learner']);
export const writingSpeedEnum = pgEnum('writing_speed', ['Speed Writing', 'Slow Writing', 'N/A']);
export const progressRatingEnum = pgEnum('progress_rating', ['Excellent', 'Good', 'Needs Improvement']);
export const planTypeEnum = pgEnum('plan_type', ['Annual', 'Monthly', 'Weekly']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default('teacher'),
  assignedClasses: text("assigned_classes").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  class: classEnum("class").notNull(),
  parentContact: text("parent_contact"),
  learningAbility: learningAbilityEnum("learning_ability").notNull(),
  writingSpeed: writingSpeedEnum("writing_speed").notNull(),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  teacherId: integer("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Progress table
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  date: timestamp("date").defaultNow(),
  socialSkills: progressRatingEnum("social_skills").notNull(),
  preLiteracy: progressRatingEnum("pre_literacy").notNull(),
  preNumeracy: progressRatingEnum("pre_numeracy").notNull(),
  motorSkills: progressRatingEnum("motor_skills").notNull(),
  emotionalDevelopment: progressRatingEnum("emotional_development").notNull(),
  comments: text("comments"),
  teacherId: integer("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teaching Plans table
export const teachingPlans = pgTable("teaching_plans", {
  id: serial("id").primaryKey(),
  type: planTypeEnum("type").notNull(),
  class: classEnum("class").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  activities: text("activities").notNull(),
  goals: text("goals").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  teacherId: integer("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recent Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation and type inference
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true });
export const insertProgressSchema = createInsertSchema(progress).omit({ id: true, createdAt: true });
export const insertTeachingPlanSchema = createInsertSchema(teachingPlans).omit({ id: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });

// For user login
export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Types for easier use in application
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type InsertTeachingPlan = z.infer<typeof insertTeachingPlanSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type TeachingPlan = typeof teachingPlans.$inferSelect;
export type Activity = typeof activities.$inferSelect;

// Type for role-based access control
export type Role = 'admin' | 'teacher';
export type Class = 'Nursery' | 'LKG' | 'UKG';
export type LearningAbility = 'Talented' | 'Average' | 'Slow Learner';
export type WritingSpeed = 'Speed Writing' | 'Slow Writing' | 'N/A';
export type ProgressRating = 'Excellent' | 'Good' | 'Needs Improvement';
export type PlanType = 'Annual' | 'Monthly' | 'Weekly';
