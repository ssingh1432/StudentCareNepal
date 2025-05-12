import {
  User, InsertUser,
  Student, InsertStudent,
  Progress, InsertProgress,
  TeachingPlan, InsertTeachingPlan,
  roleEnum, classEnum, learningAbilityEnum, writingSpeedEnum, planTypeEnum, progressRatingEnum
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getTeachers(): Promise<User[]>;
  
  // Student operations
  getStudent(id: number): Promise<Student | undefined>;
  getStudents(filters?: {
    class?: string;
    teacherId?: number;
    learningAbility?: string;
  }): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  assignStudentToTeacher(studentId: number, teacherId: number): Promise<boolean>;
  
  // Progress operations
  getProgress(id: number): Promise<Progress | undefined>;
  getProgressByStudent(studentId: number): Promise<Progress[]>;
  createProgress(progress: InsertProgress): Promise<Progress>;
  updateProgress(id: number, progress: Partial<Progress>): Promise<Progress | undefined>;
  deleteProgress(id: number): Promise<boolean>;
  
  // Teaching Plan operations
  getTeachingPlan(id: number): Promise<TeachingPlan | undefined>;
  getTeachingPlans(filters?: {
    type?: string;
    class?: string;
    teacherId?: number;
  }): Promise<TeachingPlan[]>;
  createTeachingPlan(plan: InsertTeachingPlan): Promise<TeachingPlan>;
  updateTeachingPlan(id: number, plan: Partial<TeachingPlan>): Promise<TeachingPlan | undefined>;
  deleteTeachingPlan(id: number): Promise<boolean>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private progresses: Map<number, Progress>;
  private teachingPlans: Map<number, TeachingPlan>;
  
  private userIdCounter: number;
  private studentIdCounter: number;
  private progressIdCounter: number;
  private planIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.progresses = new Map();
    this.teachingPlans = new Map();
    
    this.userIdCounter = 1;
    this.studentIdCounter = 1;
    this.progressIdCounter = 1;
    this.planIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours in milliseconds
    });
    
    // Create default admin user
    this.createUser({
      email: 'admin@school.com',
      password: 'lkg123', // This will be hashed in the auth.ts file
      name: 'Admin User',
      role: 'admin',
      assignedClasses: [],
    });
    
    // Create default teacher users
    this.createUser({
      email: 'teacher1@school.com',
      password: 'lkg123',
      name: 'Anita Gurung',
      role: 'teacher',
      assignedClasses: ['Nursery'],
    });
    
    this.createUser({
      email: 'teacher2@school.com',
      password: 'lkg123',
      name: 'Binay Shrestha',
      role: 'teacher',
      assignedClasses: ['LKG'],
    });
    
    this.createUser({
      email: 'teacher3@school.com',
      password: 'lkg123',
      name: 'Champa Devi',
      role: 'teacher',
      assignedClasses: ['UKG'],
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getTeachers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === 'teacher'
    );
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudents(filters?: {
    class?: string;
    teacherId?: number;
    learningAbility?: string;
  }): Promise<Student[]> {
    let students = Array.from(this.students.values());
    
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

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const newStudent: Student = { ...student, id };
    this.students.set(id, newStudent);
    return newStudent;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    
    const updatedStudent = { ...student, ...studentData };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.students.delete(id);
  }

  async assignStudentToTeacher(studentId: number, teacherId: number): Promise<boolean> {
    const student = this.students.get(studentId);
    if (!student) return false;
    
    const teacher = this.users.get(teacherId);
    if (!teacher || teacher.role !== 'teacher') return false;
    
    student.teacherId = teacherId;
    this.students.set(studentId, student);
    return true;
  }

  // Progress operations
  async getProgress(id: number): Promise<Progress | undefined> {
    return this.progresses.get(id);
  }

  async getProgressByStudent(studentId: number): Promise<Progress[]> {
    return Array.from(this.progresses.values()).filter(
      (progress) => progress.studentId === studentId
    );
  }

  async createProgress(progress: InsertProgress): Promise<Progress> {
    const id = this.progressIdCounter++;
    const newProgress: Progress = { ...progress, id };
    this.progresses.set(id, newProgress);
    return newProgress;
  }

  async updateProgress(id: number, progressData: Partial<Progress>): Promise<Progress | undefined> {
    const progress = this.progresses.get(id);
    if (!progress) return undefined;
    
    const updatedProgress = { ...progress, ...progressData };
    this.progresses.set(id, updatedProgress);
    return updatedProgress;
  }

  async deleteProgress(id: number): Promise<boolean> {
    return this.progresses.delete(id);
  }

  // Teaching Plan operations
  async getTeachingPlan(id: number): Promise<TeachingPlan | undefined> {
    return this.teachingPlans.get(id);
  }

  async getTeachingPlans(filters?: {
    type?: string;
    class?: string;
    teacherId?: number;
  }): Promise<TeachingPlan[]> {
    let plans = Array.from(this.teachingPlans.values());
    
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

  async createTeachingPlan(plan: InsertTeachingPlan): Promise<TeachingPlan> {
    const id = this.planIdCounter++;
    const newPlan: TeachingPlan = { ...plan, id };
    this.teachingPlans.set(id, newPlan);
    return newPlan;
  }

  async updateTeachingPlan(id: number, planData: Partial<TeachingPlan>): Promise<TeachingPlan | undefined> {
    const plan = this.teachingPlans.get(id);
    if (!plan) return undefined;
    
    const updatedPlan = { ...plan, ...planData };
    this.teachingPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteTeachingPlan(id: number): Promise<boolean> {
    return this.teachingPlans.delete(id);
  }
}

export const storage = new MemStorage();
