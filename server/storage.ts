import { users, students, progress, teachingPlans } from "@shared/schema";
import type { User, InsertUser, Student, InsertStudent, Progress, InsertProgress, TeachingPlan, InsertTeachingPlan } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>; // For authentication compatibility
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getTeachers(): Promise<User[]>;

  // Student operations
  getStudents(teacherId: number, isAdmin: boolean): Promise<Student[]>;
  getStudentById(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;

  // Progress operations
  getStudentProgress(studentId: number): Promise<Progress[]>;
  getProgressById(id: number): Promise<Progress | undefined>;
  createProgress(progress: InsertProgress): Promise<Progress>;
  updateProgress(id: number, progress: Partial<InsertProgress>): Promise<Progress>;
  deleteProgress(id: number): Promise<void>;

  // Teaching plan operations
  getTeachingPlans(teacherId: number, isAdmin: boolean, type?: string, classLevel?: string): Promise<TeachingPlan[]>;
  getTeachingPlanById(id: number): Promise<TeachingPlan | undefined>;
  createTeachingPlan(plan: InsertTeachingPlan): Promise<TeachingPlan>;
  updateTeachingPlan(id: number, plan: Partial<InsertTeachingPlan>): Promise<TeachingPlan>;
  deleteTeachingPlan(id: number): Promise<void>;

  // Report operations
  getProgressReport(teacherId: number, isAdmin: boolean, classLevel?: string, filterTeacherId?: number, startDate?: string, endDate?: string): Promise<any>;
  getTeachingPlanReport(teacherId: number, isAdmin: boolean, classLevel?: string, filterTeacherId?: number): Promise<any>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private studentsMap: Map<number, Student>;
  private progressMap: Map<number, Progress>;
  private teachingPlansMap: Map<number, TeachingPlan>;
  private currentUserId: number;
  private currentStudentId: number;
  private currentProgressId: number;
  private currentPlanId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.usersMap = new Map();
    this.studentsMap = new Map();
    this.progressMap = new Map();
    this.teachingPlansMap = new Map();
    this.currentUserId = 1;
    this.currentStudentId = 1;
    this.currentProgressId = 1;
    this.currentPlanId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });

    // Seed demo users
    const demoPassword = "lkg123"; // Simple plaintext password for demo purposes
    
    this.createUser({
      email: "admin@school.com",
      password: demoPassword,
      role: "admin",
      name: "Admin User",
      assignedClasses: ["Nursery", "LKG", "UKG"]
    });
    
    this.createUser({
      email: "teacher1@school.com",
      password: demoPassword,
      role: "teacher",
      name: "Teacher One",
      assignedClasses: ["Nursery", "LKG"]
    });

    // Seed additional teachers
    this.createUser({
      email: "teacher2@school.com",
      password: demoPassword,
      role: "teacher",
      name: "LKG Teacher",
      assignedClasses: ["LKG"]
    });

    this.createUser({
      email: "teacher3@school.com",
      password: demoPassword,
      role: "teacher",
      name: "UKG Teacher",
      assignedClasses: ["UKG"]
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // In our system, email is used as username
    return this.getUserByEmail(username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.usersMap.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const user = this.usersMap.get(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    const updatedUser = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    if (!this.usersMap.delete(id)) {
      throw new Error(`User with ID ${id} not found`);
    }
  }

  async getTeachers(): Promise<User[]> {
    return Array.from(this.usersMap.values()).filter(user => user.role === "teacher");
  }

  // Student operations
  async getStudents(teacherId: number, isAdmin: boolean): Promise<Student[]> {
    const students = Array.from(this.studentsMap.values());
    if (isAdmin) {
      return students;
    }
    return students.filter(student => student.teacherId === teacherId);
  }

  async getStudentById(id: number): Promise<Student | undefined> {
    return this.studentsMap.get(id);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.currentStudentId++;
    const newStudent: Student = { ...student, id };
    this.studentsMap.set(id, newStudent);
    return newStudent;
  }

  async updateStudent(id: number, studentData: Partial<InsertStudent>): Promise<Student> {
    const student = this.studentsMap.get(id);
    if (!student) {
      throw new Error(`Student with ID ${id} not found`);
    }
    const updatedStudent = { ...student, ...studentData };
    this.studentsMap.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<void> {
    if (!this.studentsMap.delete(id)) {
      throw new Error(`Student with ID ${id} not found`);
    }
  }

  // Progress operations
  async getStudentProgress(studentId: number): Promise<Progress[]> {
    return Array.from(this.progressMap.values()).filter(p => p.studentId === studentId);
  }

  async getProgressById(id: number): Promise<Progress | undefined> {
    return this.progressMap.get(id);
  }

  async createProgress(progressData: InsertProgress): Promise<Progress> {
    const id = this.currentProgressId++;
    const newProgress: Progress = { ...progressData, id };
    this.progressMap.set(id, newProgress);
    return newProgress;
  }

  async updateProgress(id: number, progressData: Partial<InsertProgress>): Promise<Progress> {
    const existingProgress = this.progressMap.get(id);
    if (!existingProgress) {
      throw new Error(`Progress with ID ${id} not found`);
    }
    const updatedProgress = { ...existingProgress, ...progressData };
    this.progressMap.set(id, updatedProgress);
    return updatedProgress;
  }

  async deleteProgress(id: number): Promise<void> {
    if (!this.progressMap.delete(id)) {
      throw new Error(`Progress with ID ${id} not found`);
    }
  }

  // Teaching plan operations
  async getTeachingPlans(teacherId: number, isAdmin: boolean, type?: string, classLevel?: string): Promise<TeachingPlan[]> {
    let plans = Array.from(this.teachingPlansMap.values());
    
    // Filter by teacher if not admin
    if (!isAdmin) {
      plans = plans.filter(plan => plan.createdBy === teacherId);
    }
    
    // Apply optional filters
    if (type) {
      plans = plans.filter(plan => plan.type === type);
    }
    
    if (classLevel) {
      plans = plans.filter(plan => plan.class === classLevel);
    }
    
    return plans;
  }

  async getTeachingPlanById(id: number): Promise<TeachingPlan | undefined> {
    return this.teachingPlansMap.get(id);
  }

  async createTeachingPlan(plan: InsertTeachingPlan): Promise<TeachingPlan> {
    const id = this.currentPlanId++;
    const newPlan: TeachingPlan = { ...plan, id, createdAt: new Date() };
    this.teachingPlansMap.set(id, newPlan);
    return newPlan;
  }

  async updateTeachingPlan(id: number, planData: Partial<InsertTeachingPlan>): Promise<TeachingPlan> {
    const plan = this.teachingPlansMap.get(id);
    if (!plan) {
      throw new Error(`Teaching plan with ID ${id} not found`);
    }
    const updatedPlan = { ...plan, ...planData };
    this.teachingPlansMap.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteTeachingPlan(id: number): Promise<void> {
    if (!this.teachingPlansMap.delete(id)) {
      throw new Error(`Teaching plan with ID ${id} not found`);
    }
  }

  // Report operations
  async getProgressReport(teacherId: number, isAdmin: boolean, classLevel?: string, filterTeacherId?: number, startDate?: string, endDate?: string): Promise<any> {
    // Get students
    let students = Array.from(this.studentsMap.values());
    
    // Filter by teacher if not admin or if specific teacher is requested
    if (!isAdmin) {
      students = students.filter(student => student.teacherId === teacherId);
    } else if (filterTeacherId) {
      students = students.filter(student => student.teacherId === filterTeacherId);
    }
    
    // Filter by class if specified
    if (classLevel) {
      students = students.filter(student => student.class === classLevel);
    }
    
    // Get progress entries for each student
    const report = await Promise.all(students.map(async student => {
      let progressEntries = Array.from(this.progressMap.values()).filter(p => p.studentId === student.id);
      
      // Filter by date range if specified
      if (startDate) {
        const start = new Date(startDate);
        progressEntries = progressEntries.filter(p => new Date(p.date) >= start);
      }
      
      if (endDate) {
        const end = new Date(endDate);
        progressEntries = progressEntries.filter(p => new Date(p.date) <= end);
      }
      
      // Get teacher name
      const teacher = this.usersMap.get(student.teacherId);
      
      return {
        student,
        teacherName: teacher ? teacher.name : 'Unknown',
        progressEntries
      };
    }));
    
    return report;
  }

  async getTeachingPlanReport(teacherId: number, isAdmin: boolean, classLevel?: string, filterTeacherId?: number): Promise<any> {
    let plans = Array.from(this.teachingPlansMap.values());
    
    // Filter by teacher if not admin or if specific teacher is requested
    if (!isAdmin) {
      plans = plans.filter(plan => plan.createdBy === teacherId);
    } else if (filterTeacherId) {
      plans = plans.filter(plan => plan.createdBy === filterTeacherId);
    }
    
    // Filter by class if specified
    if (classLevel) {
      plans = plans.filter(plan => plan.class === classLevel);
    }
    
    // Get teacher info for each plan
    const report = await Promise.all(plans.map(async plan => {
      const teacher = this.usersMap.get(plan.createdBy);
      
      return {
        plan,
        teacherName: teacher ? teacher.name : 'Unknown'
      };
    }));
    
    return report;
  }
}

export const storage = new MemStorage();
