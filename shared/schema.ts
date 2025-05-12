import { pgTable, text, serial, integer, boolean, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for dropdown options
export const roleEnum = pgEnum('role', ['admin', 'teacher']);
export const classEnum = pgEnum('class', ['Nursery', 'LKG', 'UKG']);
export const learningAbilityEnum = pgEnum('learning_ability', ['Talented', 'Average', 'Slow Learner']);
export const writingSpeedEnum = pgEnum('writing_speed', ['Speed Writing', 'Slow Writing', 'N/A']);
export const planTypeEnum = pgEnum('plan_type', ['Annual', 'Monthly', 'Weekly']);
export const progressRatingEnum = pgEnum('progress_rating', ['Excellent', 'Good', 'Needs Improvement']);

// User model (Admin and Teachers)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull().default('teacher'),
  assignedClasses: text('assigned_classes').array(),
});

// Student model
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  class: classEnum('class').notNull(),
  parentContact: text('parent_contact'),
  learningAbility: learningAbilityEnum('learning_ability').notNull(),
  writingSpeed: writingSpeedEnum('writing_speed').notNull(),
  notes: text('notes'),
  photoUrl: text('photo_url'),
  teacherId: integer('teacher_id').notNull(),
});

// Progress Tracking model
export const progress = pgTable('progress', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  date: date('date').notNull().defaultNow(),
  socialSkills: progressRatingEnum('social_skills').notNull(),
  preLiteracy: progressRatingEnum('pre_literacy').notNull(),
  preNumeracy: progressRatingEnum('pre_numeracy').notNull(),
  motorSkills: progressRatingEnum('motor_skills').notNull(),
  emotionalDevelopment: progressRatingEnum('emotional_development').notNull(),
  comments: text('comments'),
});

// Teaching Plan model
export const teachingPlans = pgTable('teaching_plans', {
  id: serial('id').primaryKey(),
  type: planTypeEnum('type').notNull(),
  class: classEnum('class').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  activities: text('activities').notNull(),
  goals: text('goals').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  teacherId: integer('teacher_id').notNull(),
});

// Zod schemas for insert operations
export const insertUserSchema = createInsertSchema(users);
export const insertStudentSchema = createInsertSchema(students);
export const insertProgressSchema = createInsertSchema(progress);
export const insertTeachingPlanSchema = createInsertSchema(teachingPlans);

// Extended schemas for validation
export const userValidationSchema = insertUserSchema.extend({
  confirmedPassword: z.string(),
});

export const studentValidationSchema = insertStudentSchema.extend({
  photo: z.any().optional(),
});

// Types for insert operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type InsertTeachingPlan = z.infer<typeof insertTeachingPlanSchema>;

// Types for validation
export type UserValidation = z.infer<typeof userValidationSchema>;
export type StudentValidation = z.infer<typeof studentValidationSchema>;

// Types for select operations
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type TeachingPlan = typeof teachingPlans.$inferSelect;

// Login credentials type
export type LoginCredentials = {
  email: string;
  password: string;
};
