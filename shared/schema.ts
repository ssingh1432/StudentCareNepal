import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enumerations
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher']);
export const studentClassEnum = pgEnum('student_class', ['Nursery', 'LKG', 'UKG']);
export const learningAbilityEnum = pgEnum('learning_ability', ['Talented', 'Average', 'Slow Learner']);
export const writingSpeedEnum = pgEnum('writing_speed', ['Speed Writing', 'Slow Writing', 'N/A']);
export const progressRatingEnum = pgEnum('progress_rating', ['Excellent', 'Good', 'Needs Improvement']);
export const planTypeEnum = pgEnum('plan_type', ['Annual', 'Monthly', 'Weekly']);

// Users (Admin and Teachers)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('teacher'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teacher assignment to classes
export const teacherClasses = pgTable('teacher_classes', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  class: studentClassEnum('class').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Students
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  class: studentClassEnum('class').notNull(),
  parentContact: text('parent_contact'),
  learningAbility: learningAbilityEnum('learning_ability').notNull(),
  writingSpeed: writingSpeedEnum('writing_speed').notNull(),
  notes: text('notes'),
  photoUrl: text('photo_url'),
  teacherId: integer('teacher_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Progress Tracking
export const progressEntries = pgTable('progress_entries', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  date: timestamp('date').defaultNow().notNull(),
  socialSkills: progressRatingEnum('social_skills').notNull(),
  preLiteracy: progressRatingEnum('pre_literacy').notNull(),
  preNumeracy: progressRatingEnum('pre_numeracy').notNull(),
  motorSkills: progressRatingEnum('motor_skills').notNull(),
  emotionalDevelopment: progressRatingEnum('emotional_development').notNull(),
  comments: text('comments'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teaching Plans
export const teachingPlans = pgTable('teaching_plans', {
  id: serial('id').primaryKey(),
  type: planTypeEnum('type').notNull(),
  class: studentClassEnum('class').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  activities: text('activities').notNull(),
  goals: text('goals').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Validation schemas using Zod
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeacherClassSchema = createInsertSchema(teacherClasses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProgressEntrySchema = createInsertSchema(progressEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeachingPlanSchema = createInsertSchema(teachingPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types with validation schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TeacherClass = typeof teacherClasses.$inferSelect;
export type InsertTeacherClass = z.infer<typeof insertTeacherClassSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type ProgressEntry = typeof progressEntries.$inferSelect;
export type InsertProgressEntry = z.infer<typeof insertProgressEntrySchema>;
export type TeachingPlan = typeof teachingPlans.$inferSelect;
export type InsertTeachingPlan = z.infer<typeof insertTeachingPlanSchema>;

// Additional validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;
