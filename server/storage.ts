import { users, students, progress, teachingPlans, activities } from "@shared/schema";
import { User, Student, Progress, TeachingPlan, Activity } from "@shared/schema";
import { InsertUser, InsertStudent, InsertProgress, InsertTeachingPlan, InsertActivity } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// Define the storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllTeachers(): Promise<User[]>;
  
  // Student management
  getStudent(id: number): Promise<Student | undefined>;
  getStudents(filters?: { class?: string, teacherId?: number, learningAbility?: string }): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  assignStudentToTeacher(studentId: number, teacherId: number): Promise<boolean>;
  
  // Progress tracking
  getProgress(id: number): Promise<Progress | undefined>;
  getProgressByStudent(studentId: number): Promise<Progress[]>;
  getProgressByClass(className: string): Promise<Progress[]>;
  createProgress(progressEntry: InsertProgress): Promise<Progress>;
  updateProgress(id: number, progressEntry: Partial<Progress>): Promise<Progress | undefined>;
  deleteProgress(id: number): Promise<boolean>;
  
  // Teaching plans
  getTeachingPlan(id: number): Promise<TeachingPlan | undefined>;
  getTeachingPlans(filters?: { type?: string, class?: string, teacherId?: number }): Promise<TeachingPlan[]>;
  createTeachingPlan(plan: InsertTeachingPlan): Promise<TeachingPlan>;
  updateTeachingPlan(id: number, plan: Partial<TeachingPlan>): Promise<TeachingPlan | undefined>;
  deleteTeachingPlan(id: number): Promise<boolean>;
  
  // Activities
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}

// Memory-based implementation of the storage interface
export class MemStorage implements IStorage {
  private userStore: Map<number, User>;
  private studentStore: Map<number, Student>;
  private progressStore: Map<number, Progress>;
  private teachingPlanStore: Map<number, TeachingPlan>;
  private activityStore: Map<number, Activity>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number = 1;
  private studentIdCounter: number = 1;
  private progressIdCounter: number = 1;
  private teachingPlanIdCounter: number = 1;
  private activityIdCounter: number = 1;
  
  constructor() {
    this.userStore = new Map();
    this.studentStore = new Map();
    this.progressStore = new Map();
    this.teachingPlanStore = new Map();
    this.activityStore = new Map();
    
    // Create memory store for sessions
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every 24h
    });
    
    // Initialize with admin user
    this.createUser({
      email: "admin@school.com",
      password: "$2b$10$3GyK8meebQQZN0t0t91.Q.k5iARDCKJOW2JhVi12ZLLiApKj2Xw12", // hashed 'lkg123'
      name: "Admin User",
      role: "admin",
      assignedClasses: []
    });
  }
  
  // User management methods
  async getUser(id: number): Promise<User | undefined> {
    return this.userStore.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.userStore.values()).find(user => user.email === email);
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...userData, id, createdAt };
    this.userStore.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.userStore.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.userStore.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.userStore.delete(id);
  }
  
  async getAllTeachers(): Promise<User[]> {
    return Array.from(this.userStore.values()).filter(user => user.role === 'teacher');
  }
  
  // Student management methods
  async getStudent(id: number): Promise<Student | undefined> {
    return this.studentStore.get(id);
  }
  
  async getStudents(filters?: { class?: string, teacherId?: number, learningAbility?: string }): Promise<Student[]> {
    let students = Array.from(this.studentStore.values());
    
    if (filters) {
      if (filters.class) {
        students = students.filter(student => student.class === filters.class);
      }
      
      if (filters.teacherId) {
        students = students.filter(student => student.teacherId === filters.teacherId);
      }
      
      if (filters.learningAbility) {
        students = students.filter(student => student.learningAbility === filters.learningAbility);
      }
    }
    
    return students;
  }
  
  async createStudent(studentData: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const createdAt = new Date();
    const student: Student = { ...studentData, id, createdAt };
    this.studentStore.set(id, student);
    return student;
  }
  
  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined> {
    const student = this.studentStore.get(id);
    if (!student) return undefined;
    
    const updatedStudent = { ...student, ...studentData };
    this.studentStore.set(id, updatedStudent);
    return updatedStudent;
  }
  
  async deleteStudent(id: number): Promise<boolean> {
    return this.studentStore.delete(id);
  }
  
  async assignStudentToTeacher(studentId: number, teacherId: number): Promise<boolean> {
    const student = this.studentStore.get(studentId);
    if (!student) return false;
    
    const teacher = this.userStore.get(teacherId);
    if (!teacher || teacher.role !== 'teacher') return false;
    
    student.teacherId = teacherId;
    this.studentStore.set(studentId, student);
    return true;
  }
  
  // Progress tracking methods
  async getProgress(id: number): Promise<Progress | undefined> {
    return this.progressStore.get(id);
  }
  
  async getProgressByStudent(studentId: number): Promise<Progress[]> {
    return Array.from(this.progressStore.values())
      .filter(progress => progress.studentId === studentId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async getProgressByClass(className: string): Promise<Progress[]> {
    const studentsInClass = await this.getStudents({ class: className });
    const studentIds = studentsInClass.map(student => student.id);
    
    return Array.from(this.progressStore.values())
      .filter(progress => studentIds.includes(progress.studentId))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async createProgress(progressData: InsertProgress): Promise<Progress> {
    const id = this.progressIdCounter++;
    const createdAt = new Date();
    const progress: Progress = { ...progressData, id, createdAt };
    this.progressStore.set(id, progress);
    return progress;
  }
  
  async updateProgress(id: number, progressData: Partial<Progress>): Promise<Progress | undefined> {
    const progressEntry = this.progressStore.get(id);
    if (!progressEntry) return undefined;
    
    const updatedProgress = { ...progressEntry, ...progressData };
    this.progressStore.set(id, updatedProgress);
    return updatedProgress;
  }
  
  async deleteProgress(id: number): Promise<boolean> {
    return this.progressStore.delete(id);
  }
  
  // Teaching plans methods
  async getTeachingPlan(id: number): Promise<TeachingPlan | undefined> {
    return this.teachingPlanStore.get(id);
  }
  
  async getTeachingPlans(filters?: { type?: string, class?: string, teacherId?: number }): Promise<TeachingPlan[]> {
    let plans = Array.from(this.teachingPlanStore.values());
    
    if (filters) {
      if (filters.type) {
        plans = plans.filter(plan => plan.type === filters.type);
      }
      
      if (filters.class) {
        plans = plans.filter(plan => plan.class === filters.class);
      }
      
      if (filters.teacherId) {
        plans = plans.filter(plan => plan.teacherId === filters.teacherId);
      }
    }
    
    return plans;
  }
  
  async createTeachingPlan(planData: InsertTeachingPlan): Promise<TeachingPlan> {
    const id = this.teachingPlanIdCounter++;
    const createdAt = new Date();
    const plan: TeachingPlan = { ...planData, id, createdAt };
    this.teachingPlanStore.set(id, plan);
    return plan;
  }
  
  async updateTeachingPlan(id: number, planData: Partial<TeachingPlan>): Promise<TeachingPlan | undefined> {
    const plan = this.teachingPlanStore.get(id);
    if (!plan) return undefined;
    
    const updatedPlan = { ...plan, ...planData };
    this.teachingPlanStore.set(id, updatedPlan);
    return updatedPlan;
  }
  
  async deleteTeachingPlan(id: number): Promise<boolean> {
    return this.teachingPlanStore.delete(id);
  }
  
  // Activity methods
  async getRecentActivities(limit = 10): Promise<Activity[]> {
    return Array.from(this.activityStore.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const createdAt = new Date();
    const activity: Activity = { ...activityData, id, createdAt };
    this.activityStore.set(id, activity);
    return activity;
  }
}

// Create and export a singleton instance of the storage
export const storage = new MemStorage();
