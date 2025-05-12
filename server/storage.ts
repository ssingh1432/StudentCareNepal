import { 
  User, InsertUser, Student, InsertStudent, Progress, InsertProgress, 
  TeachingPlan, InsertTeachingPlan, AiSuggestion, InsertAiSuggestion,
  users, students, progress, teachingPlans, aiSuggestions
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// Memory store for sessions
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllTeachers(): Promise<User[]>;
  
  // Student operations
  getStudent(id: number): Promise<Student | undefined>;
  getStudentsByClass(className: string): Promise<Student[]>;
  getStudentsByTeacher(teacherId: number): Promise<Student[]>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  assignStudentToTeacher(studentId: number, teacherId: number): Promise<boolean>;

  // Progress operations
  getProgressById(id: number): Promise<Progress | undefined>;
  getProgressByStudent(studentId: number): Promise<Progress[]>;
  createProgress(progress: InsertProgress): Promise<Progress>;
  updateProgress(id: number, progress: Partial<InsertProgress>): Promise<Progress | undefined>;
  deleteProgress(id: number): Promise<boolean>;

  // Teaching Plan operations
  getTeachingPlan(id: number): Promise<TeachingPlan | undefined>;
  getTeachingPlansByClass(className: string): Promise<TeachingPlan[]>;
  getTeachingPlansByType(type: string): Promise<TeachingPlan[]>;
  getTeachingPlansByCreator(creatorId: number): Promise<TeachingPlan[]>;
  getAllTeachingPlans(): Promise<TeachingPlan[]>;
  createTeachingPlan(plan: InsertTeachingPlan): Promise<TeachingPlan>;
  updateTeachingPlan(id: number, plan: Partial<InsertTeachingPlan>): Promise<TeachingPlan | undefined>;
  deleteTeachingPlan(id: number): Promise<boolean>;

  // AI Suggestion operations
  getAiSuggestionByPrompt(prompt: string): Promise<AiSuggestion | undefined>;
  createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private studentsData: Map<number, Student>;
  private progressData: Map<number, Progress>;
  private teachingPlansData: Map<number, TeachingPlan>;
  private aiSuggestionsData: Map<number, AiSuggestion>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private studentIdCounter: number;
  private progressIdCounter: number;
  private teachingPlanIdCounter: number;
  private aiSuggestionIdCounter: number;

  constructor() {
    this.usersData = new Map();
    this.studentsData = new Map();
    this.progressData = new Map();
    this.teachingPlansData = new Map();
    this.aiSuggestionsData = new Map();
    
    this.userIdCounter = 1;
    this.studentIdCounter = 1;
    this.progressIdCounter = 1;
    this.teachingPlanIdCounter = 1;
    this.aiSuggestionIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with admin user
    this.createUser({
      email: "admin@school.com",
      password: "lkg123",
      name: "Admin User",
      role: "admin",
      assignedClasses: ["Nursery", "LKG", "UKG"]
    });
    
    // Initialize with teacher users
    this.createUser({
      email: "teacher1@school.com",
      password: "lkg123",
      name: "Teacher Nursery",
      role: "teacher",
      assignedClasses: ["Nursery"]
    });
    
    this.createUser({
      email: "teacher2@school.com",
      password: "lkg123",
      name: "Teacher LKG",
      role: "teacher",
      assignedClasses: ["LKG"]
    });
    
    this.createUser({
      email: "teacher3@school.com",
      password: "lkg123",
      name: "Teacher UKG",
      role: "teacher",
      assignedClasses: ["UKG"]
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...userData, id, createdAt: now };
    this.usersData.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersData.delete(id);
  }

  async getAllTeachers(): Promise<User[]> {
    return Array.from(this.usersData.values()).filter(user => user.role === "teacher");
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return this.studentsData.get(id);
  }

  async getStudentsByClass(className: string): Promise<Student[]> {
    return Array.from(this.studentsData.values()).filter(student => student.class === className);
  }

  async getStudentsByTeacher(teacherId: number): Promise<Student[]> {
    return Array.from(this.studentsData.values()).filter(student => student.teacherId === teacherId);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.studentsData.values());
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const now = new Date();
    const student: Student = { ...studentData, id, createdAt: now };
    this.studentsData.set(id, student);
    return student;
  }

  async updateStudent(id: number, studentData: Partial<InsertStudent>): Promise<Student | undefined> {
    const student = this.studentsData.get(id);
    if (!student) return undefined;
    
    const updatedStudent = { ...student, ...studentData };
    this.studentsData.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.studentsData.delete(id);
  }

  async assignStudentToTeacher(studentId: number, teacherId: number): Promise<boolean> {
    const student = this.studentsData.get(studentId);
    if (!student) return false;
    
    const teacher = this.usersData.get(teacherId);
    if (!teacher || teacher.role !== "teacher") return false;
    
    student.teacherId = teacherId;
    this.studentsData.set(studentId, student);
    return true;
  }

  // Progress operations
  async getProgressById(id: number): Promise<Progress | undefined> {
    return this.progressData.get(id);
  }

  async getProgressByStudent(studentId: number): Promise<Progress[]> {
    return Array.from(this.progressData.values()).filter(p => p.studentId === studentId);
  }

  async createProgress(progressData: InsertProgress): Promise<Progress> {
    const id = this.progressIdCounter++;
    const progress: Progress = { ...progressData, id };
    this.progressData.set(id, progress);
    return progress;
  }

  async updateProgress(id: number, progressData: Partial<InsertProgress>): Promise<Progress | undefined> {
    const progress = this.progressData.get(id);
    if (!progress) return undefined;
    
    const updatedProgress = { ...progress, ...progressData };
    this.progressData.set(id, updatedProgress);
    return updatedProgress;
  }

  async deleteProgress(id: number): Promise<boolean> {
    return this.progressData.delete(id);
  }

  // Teaching Plan operations
  async getTeachingPlan(id: number): Promise<TeachingPlan | undefined> {
    return this.teachingPlansData.get(id);
  }

  async getTeachingPlansByClass(className: string): Promise<TeachingPlan[]> {
    return Array.from(this.teachingPlansData.values()).filter(plan => plan.class === className);
  }

  async getTeachingPlansByType(type: string): Promise<TeachingPlan[]> {
    return Array.from(this.teachingPlansData.values()).filter(plan => plan.type === type);
  }

  async getTeachingPlansByCreator(creatorId: number): Promise<TeachingPlan[]> {
    return Array.from(this.teachingPlansData.values()).filter(plan => plan.createdBy === creatorId);
  }

  async getAllTeachingPlans(): Promise<TeachingPlan[]> {
    return Array.from(this.teachingPlansData.values());
  }

  async createTeachingPlan(planData: InsertTeachingPlan): Promise<TeachingPlan> {
    const id = this.teachingPlanIdCounter++;
    const now = new Date();
    const plan: TeachingPlan = { ...planData, id, createdAt: now };
    this.teachingPlansData.set(id, plan);
    return plan;
  }

  async updateTeachingPlan(id: number, planData: Partial<InsertTeachingPlan>): Promise<TeachingPlan | undefined> {
    const plan = this.teachingPlansData.get(id);
    if (!plan) return undefined;
    
    const updatedPlan = { ...plan, ...planData };
    this.teachingPlansData.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteTeachingPlan(id: number): Promise<boolean> {
    return this.teachingPlansData.delete(id);
  }

  // AI Suggestion operations
  async getAiSuggestionByPrompt(prompt: string): Promise<AiSuggestion | undefined> {
    return Array.from(this.aiSuggestionsData.values()).find(s => s.prompt === prompt);
  }

  async createAiSuggestion(suggestionData: InsertAiSuggestion): Promise<AiSuggestion> {
    const id = this.aiSuggestionIdCounter++;
    const now = new Date();
    const suggestion: AiSuggestion = { ...suggestionData, id, createdAt: now };
    this.aiSuggestionsData.set(id, suggestion);
    return suggestion;
  }
}

export const storage = new MemStorage();
