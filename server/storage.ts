import { 
  users, User, InsertUser, 
  teacherClasses, TeacherClass, InsertTeacherClass,
  students, Student, InsertStudent,
  progressEntries, ProgressEntry, InsertProgressEntry,
  teachingPlans, TeachingPlan, InsertTeachingPlan
} from "@shared/schema";
import * as bcrypt from 'bcrypt';

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllTeachers(): Promise<User[]>;

  // Teacher classes
  getTeacherClasses(teacherId: number): Promise<TeacherClass[]>;
  assignClassToTeacher(teacherClass: InsertTeacherClass): Promise<TeacherClass>;
  removeClassFromTeacher(id: number): Promise<boolean>;

  // Student management
  getStudent(id: number): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  getStudentsByClass(className: string): Promise<Student[]>;
  getStudentsByTeacher(teacherId: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  assignStudentToTeacher(studentId: number, teacherId: number): Promise<Student | undefined>;

  // Progress tracking
  getProgressEntry(id: number): Promise<ProgressEntry | undefined>;
  getProgressEntriesByStudent(studentId: number): Promise<ProgressEntry[]>;
  createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry>;
  updateProgressEntry(id: number, entry: Partial<InsertProgressEntry>): Promise<ProgressEntry | undefined>;
  deleteProgressEntry(id: number): Promise<boolean>;

  // Teaching plans
  getTeachingPlan(id: number): Promise<TeachingPlan | undefined>;
  getAllTeachingPlans(): Promise<TeachingPlan[]>;
  getTeachingPlansByClass(className: string): Promise<TeachingPlan[]>;
  getTeachingPlansByTeacher(teacherId: number): Promise<TeachingPlan[]>;
  createTeachingPlan(plan: InsertTeachingPlan): Promise<TeachingPlan>;
  updateTeachingPlan(id: number, plan: Partial<InsertTeachingPlan>): Promise<TeachingPlan | undefined>;
  deleteTeachingPlan(id: number): Promise<boolean>;

  // Authentication
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teacherClasses: Map<number, TeacherClass>;
  private students: Map<number, Student>;
  private progressEntries: Map<number, ProgressEntry>;
  private teachingPlans: Map<number, TeachingPlan>;
  private userIdCounter: number;
  private teacherClassIdCounter: number;
  private studentIdCounter: number;
  private progressEntryIdCounter: number;
  private teachingPlanIdCounter: number;

  constructor() {
    this.users = new Map();
    this.teacherClasses = new Map();
    this.students = new Map();
    this.progressEntries = new Map();
    this.teachingPlans = new Map();
    this.userIdCounter = 1;
    this.teacherClassIdCounter = 1;
    this.studentIdCounter = 1;
    this.progressEntryIdCounter = 1;
    this.teachingPlanIdCounter = 1;

    // Seed admin user (don't really need to hash in memory storage but good practice)
    this.hashPassword('lkg123').then(hashedPassword => {
      this.users.set(this.userIdCounter, {
        id: this.userIdCounter++,
        email: 'admin@school.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Seed teacher users
      const teacherEmails = ['teacher1@school.com', 'teacher2@school.com', 'teacher3@school.com'];
      const teacherNames = ['Anita Gurung', 'Binay Shrestha', 'Champa Devi'];
      const classes = ['Nursery', 'LKG', 'UKG'];

      teacherEmails.forEach((email, index) => {
        this.hashPassword('lkg123').then(hashedPassword => {
          const teacherId = this.userIdCounter;
          this.users.set(teacherId, {
            id: teacherId,
            email: email,
            password: hashedPassword,
            name: teacherNames[index],
            role: 'teacher',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          this.userIdCounter++;

          // Assign class to teacher
          this.teacherClasses.set(this.teacherClassIdCounter, {
            id: this.teacherClassIdCounter,
            teacherId: teacherId,
            class: classes[index] as any,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          this.teacherClassIdCounter++;

          // Seed students for each teacher/class (10 per class)
          for (let i = 1; i <= 10; i++) {
            const className = classes[index];
            const age = className === 'Nursery' ? 3 : (className === 'LKG' ? 4 : 5);
            const learningAbilities = ['Talented', 'Average', 'Slow Learner'];
            const writingSpeeds = className === 'Nursery' ? ['N/A'] : ['Speed Writing', 'Slow Writing'];
            
            this.students.set(this.studentIdCounter, {
              id: this.studentIdCounter,
              name: `Student ${this.studentIdCounter} (${className})`,
              age: age,
              class: className as any,
              parentContact: `+977 98${Math.floor(10000000 + Math.random() * 90000000)}`,
              learningAbility: learningAbilities[Math.floor(Math.random() * learningAbilities.length)] as any,
              writingSpeed: writingSpeeds[Math.floor(Math.random() * writingSpeeds.length)] as any,
              notes: '',
              photoUrl: '',
              teacherId: teacherId,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            // Add progress entries for some students
            if (i <= 5) {
              const ratings = ['Excellent', 'Good', 'Needs Improvement'];
              this.progressEntries.set(this.progressEntryIdCounter, {
                id: this.progressEntryIdCounter,
                studentId: this.studentIdCounter,
                date: new Date(),
                socialSkills: ratings[Math.floor(Math.random() * ratings.length)] as any,
                preLiteracy: ratings[Math.floor(Math.random() * ratings.length)] as any,
                preNumeracy: ratings[Math.floor(Math.random() * ratings.length)] as any,
                motorSkills: ratings[Math.floor(Math.random() * ratings.length)] as any,
                emotionalDevelopment: ratings[Math.floor(Math.random() * ratings.length)] as any,
                comments: `Progress entry for student ${this.studentIdCounter}`,
                createdBy: teacherId,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              this.progressEntryIdCounter++;
            }

            this.studentIdCounter++;
          }

          // Create teaching plans for each class
          const planTypes = ['Annual', 'Monthly', 'Weekly', 'Weekly'];
          planTypes.forEach((type, planIndex) => {
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();
            
            if (type === 'Annual') {
              startDate = new Date(now.getFullYear(), 0, 1);
              endDate = new Date(now.getFullYear(), 11, 31);
            } else if (type === 'Monthly') {
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            } else {
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
            }

            this.teachingPlans.set(this.teachingPlanIdCounter, {
              id: this.teachingPlanIdCounter,
              type: type as any,
              class: classes[index] as any,
              title: `${type} Plan for ${classes[index]} - ${planIndex + 1}`,
              description: `This is a ${type.toLowerCase()} teaching plan for ${classes[index]} class.`,
              activities: `Activities for ${classes[index]} ${type.toLowerCase()} plan`,
              goals: `Learning goals for ${classes[index]} ${type.toLowerCase()} plan`,
              startDate: startDate,
              endDate: endDate,
              createdBy: teacherId,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            this.teachingPlanIdCounter++;
          });
        });
      });
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = {
      id,
      ...userData,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...userData,
      updatedAt: new Date()
    };

    if (userData.password) {
      updatedUser.password = await this.hashPassword(userData.password);
    }

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllTeachers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === 'teacher');
  }

  // Teacher Classes
  async getTeacherClasses(teacherId: number): Promise<TeacherClass[]> {
    return Array.from(this.teacherClasses.values())
      .filter(tc => tc.teacherId === teacherId);
  }

  async assignClassToTeacher(teacherClass: InsertTeacherClass): Promise<TeacherClass> {
    const id = this.teacherClassIdCounter++;
    const now = new Date();
    const newTeacherClass: TeacherClass = {
      id,
      ...teacherClass,
      createdAt: now,
      updatedAt: now
    };
    this.teacherClasses.set(id, newTeacherClass);
    return newTeacherClass;
  }

  async removeClassFromTeacher(id: number): Promise<boolean> {
    return this.teacherClasses.delete(id);
  }

  // Student Management
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudentsByClass(className: string): Promise<Student[]> {
    return Array.from(this.students.values())
      .filter(student => student.class === className);
  }

  async getStudentsByTeacher(teacherId: number): Promise<Student[]> {
    return Array.from(this.students.values())
      .filter(student => student.teacherId === teacherId);
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const now = new Date();
    const student: Student = {
      id,
      ...studentData,
      createdAt: now,
      updatedAt: now
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: number, studentData: Partial<InsertStudent>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;

    const updatedStudent: Student = {
      ...student,
      ...studentData,
      updatedAt: new Date()
    };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.students.delete(id);
  }

  async assignStudentToTeacher(studentId: number, teacherId: number): Promise<Student | undefined> {
    const student = this.students.get(studentId);
    if (!student) return undefined;

    const updatedStudent: Student = {
      ...student,
      teacherId,
      updatedAt: new Date()
    };
    this.students.set(studentId, updatedStudent);
    return updatedStudent;
  }

  // Progress Tracking
  async getProgressEntry(id: number): Promise<ProgressEntry | undefined> {
    return this.progressEntries.get(id);
  }

  async getProgressEntriesByStudent(studentId: number): Promise<ProgressEntry[]> {
    return Array.from(this.progressEntries.values())
      .filter(entry => entry.studentId === studentId);
  }

  async createProgressEntry(entryData: InsertProgressEntry): Promise<ProgressEntry> {
    const id = this.progressEntryIdCounter++;
    const now = new Date();
    const entry: ProgressEntry = {
      id,
      ...entryData,
      createdAt: now,
      updatedAt: now
    };
    this.progressEntries.set(id, entry);
    return entry;
  }

  async updateProgressEntry(id: number, entryData: Partial<InsertProgressEntry>): Promise<ProgressEntry | undefined> {
    const entry = this.progressEntries.get(id);
    if (!entry) return undefined;

    const updatedEntry: ProgressEntry = {
      ...entry,
      ...entryData,
      updatedAt: new Date()
    };
    this.progressEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteProgressEntry(id: number): Promise<boolean> {
    return this.progressEntries.delete(id);
  }

  // Teaching Plans
  async getTeachingPlan(id: number): Promise<TeachingPlan | undefined> {
    return this.teachingPlans.get(id);
  }

  async getAllTeachingPlans(): Promise<TeachingPlan[]> {
    return Array.from(this.teachingPlans.values());
  }

  async getTeachingPlansByClass(className: string): Promise<TeachingPlan[]> {
    return Array.from(this.teachingPlans.values())
      .filter(plan => plan.class === className);
  }

  async getTeachingPlansByTeacher(teacherId: number): Promise<TeachingPlan[]> {
    return Array.from(this.teachingPlans.values())
      .filter(plan => plan.createdBy === teacherId);
  }

  async createTeachingPlan(planData: InsertTeachingPlan): Promise<TeachingPlan> {
    const id = this.teachingPlanIdCounter++;
    const now = new Date();
    const plan: TeachingPlan = {
      id,
      ...planData,
      createdAt: now,
      updatedAt: now
    };
    this.teachingPlans.set(id, plan);
    return plan;
  }

  async updateTeachingPlan(id: number, planData: Partial<InsertTeachingPlan>): Promise<TeachingPlan | undefined> {
    const plan = this.teachingPlans.get(id);
    if (!plan) return undefined;

    const updatedPlan: TeachingPlan = {
      ...plan,
      ...planData,
      updatedAt: new Date()
    };
    this.teachingPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteTeachingPlan(id: number): Promise<boolean> {
    return this.teachingPlans.delete(id);
  }

  // Authentication methods
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    // In a real application, this would be bcrypt.compare()
    // But we can simulate it for memory storage
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      return password === hashedPassword; // Fallback for testing
    }
  }

  async hashPassword(password: string): Promise<string> {
    // In a real application, this would be bcrypt.hash()
    try {
      return await bcrypt.hash(password, 10);
    } catch (error) {
      return password; // Fallback for testing
    }
  }
}

export const storage = new MemStorage();
