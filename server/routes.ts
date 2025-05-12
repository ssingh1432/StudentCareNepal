import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertStudentSchema, 
  insertProgressEntrySchema, 
  insertTeachingPlanSchema, 
  insertAiSuggestionSchema 
} from "@shared/schema";
import { ZodError } from "zod";

// Helper function to validate user has access to specified class
const validateClassAccess = (req: Request, classValue: string) => {
  if (!req.isAuthenticated()) return false;
  if (req.user.role === 'admin') return true;
  return req.user.assignedClasses.includes(classValue);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Error handling middleware for ZodError
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: err.errors 
      });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  };

  // -------------------- Student Routes --------------------
  
  // Get all students (filtered by teacher assignment)
  app.get("/api/students", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const classFilter = req.query.class as string;
    const teacherFilter = req.query.teacherId as string;
    
    try {
      let students;
      if (req.user.role === 'admin') {
        students = storage.getAllStudents({ 
          classFilter: classFilter || undefined,
          teacherFilter: teacherFilter ? parseInt(teacherFilter) : undefined
        });
      } else {
        students = storage.getStudentsByTeacherId(req.user.id, classFilter || undefined);
      }
      res.json(students);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Get student by ID
  app.get("/api/students/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const id = parseInt(req.params.id);
      const student = storage.getStudent(id);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check if user has access to this student
      if (req.user.role !== 'admin' && student.teacherId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to view this student" });
      }
      
      res.json(student);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  // Create student
  app.post("/api/students", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const studentData = insertStudentSchema.parse(req.body);
      
      // Validate class access
      if (!validateClassAccess(req, studentData.class)) {
        return res.status(403).json({ message: "You don't have permission to add students to this class" });
      }
      
      // If teacher is creating student, override teacherId with their own ID
      if (req.user.role === 'teacher') {
        studentData.teacherId = req.user.id;
      }
      
      const newStudent = storage.createStudent(studentData);
      res.status(201).json(newStudent);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  // Update student
  app.put("/api/students/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const id = parseInt(req.params.id);
      const student = storage.getStudent(id);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check if user has permission to update this student
      if (req.user.role !== 'admin' && student.teacherId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this student" });
      }
      
      const studentData = insertStudentSchema.parse(req.body);
      
      // Validate class access for the new class
      if (!validateClassAccess(req, studentData.class)) {
        return res.status(403).json({ message: "You don't have permission to move students to this class" });
      }
      
      // If teacher is updating, ensure they can't change teacher assignment
      if (req.user.role === 'teacher') {
        studentData.teacherId = req.user.id;
      }
      
      const updatedStudent = storage.updateStudent(id, studentData);
      res.json(updatedStudent);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  // Delete student
  app.delete("/api/students/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const id = parseInt(req.params.id);
      const student = storage.getStudent(id);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check if user has permission to delete this student
      if (req.user.role !== 'admin' && student.teacherId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this student" });
      }
      
      storage.deleteStudent(id);
      res.status(200).json({ message: "Student deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // -------------------- Progress Routes --------------------
  
  // Get progress entries for a student
  app.get("/api/students/:id/progress", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const studentId = parseInt(req.params.id);
      const student = storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check if user has access to this student
      if (req.user.role !== 'admin' && student.teacherId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to view this student's progress" });
      }
      
      const progress = storage.getProgressEntriesByStudentId(studentId);
      res.json(progress);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch progress entries" });
    }
  });

  // Create progress entry
  app.post("/api/progress", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const progressData = insertProgressEntrySchema.parse({
        ...req.body,
        createdBy: req.user.id // Set the creator ID automatically
      });
      
      // Check if student exists and user has access
      const student = storage.getStudent(progressData.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (req.user.role !== 'admin' && student.teacherId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to add progress for this student" });
      }
      
      const newProgress = storage.createProgressEntry(progressData);
      res.status(201).json(newProgress);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  // Update progress entry
  app.put("/api/progress/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const id = parseInt(req.params.id);
      const progressEntry = storage.getProgressEntry(id);
      
      if (!progressEntry) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      
      // Check if user has permission to update this progress entry
      if (req.user.role !== 'admin' && progressEntry.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this progress entry" });
      }
      
      const progressData = insertProgressEntrySchema.parse({
        ...req.body,
        createdBy: progressEntry.createdBy // Preserve original creator
      });
      
      // Validate that the student exists and user has access
      const student = storage.getStudent(progressData.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (req.user.role !== 'admin' && student.teacherId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update progress for this student" });
      }
      
      const updatedProgress = storage.updateProgressEntry(id, progressData);
      res.json(updatedProgress);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  // Delete progress entry
  app.delete("/api/progress/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const id = parseInt(req.params.id);
      const progressEntry = storage.getProgressEntry(id);
      
      if (!progressEntry) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      
      // Check if user has permission to delete this progress entry
      if (req.user.role !== 'admin' && progressEntry.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this progress entry" });
      }
      
      storage.deleteProgressEntry(id);
      res.status(200).json({ message: "Progress entry deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete progress entry" });
    }
  });

  // -------------------- Teaching Plan Routes --------------------
  
  // Get all teaching plans (filtered by class, type, and teacher)
  app.get("/api/plans", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const classFilter = req.query.class as string;
    const typeFilter = req.query.type as string;
    const teacherFilter = req.query.teacherId as string;
    
    try {
      let plans;
      if (req.user.role === 'admin') {
        plans = storage.getAllTeachingPlans({
          classFilter: classFilter || undefined,
          typeFilter: typeFilter || undefined,
          createdByFilter: teacherFilter ? parseInt(teacherFilter) : undefined
        });
      } else {
        // For teachers, only show plans they created or plans for their assigned classes
        plans = storage.getTeachingPlansByTeacherId(req.user.id, {
          classFilter: classFilter || undefined,
          typeFilter: typeFilter || undefined
        });
      }
      res.json(plans);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch teaching plans" });
    }
  });

  // Get teaching plan by ID
  app.get("/api/plans/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const id = parseInt(req.params.id);
      const plan = storage.getTeachingPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Check if user has access to this plan
      if (req.user.role !== 'admin' && plan.createdBy !== req.user.id && 
          !req.user.assignedClasses.includes(plan.class)) {
        return res.status(403).json({ message: "You don't have permission to view this teaching plan" });
      }
      
      res.json(plan);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch teaching plan" });
    }
  });

  // Create teaching plan
  app.post("/api/plans", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const planData = insertTeachingPlanSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      // Validate class access
      if (!validateClassAccess(req, planData.class)) {
        return res.status(403).json({ message: "You don't have permission to create plans for this class" });
      }
      
      const newPlan = storage.createTeachingPlan(planData);
      res.status(201).json(newPlan);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  // Update teaching plan
  app.put("/api/plans/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const id = parseInt(req.params.id);
      const plan = storage.getTeachingPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Check if user has permission to update this plan
      if (req.user.role !== 'admin' && plan.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this teaching plan" });
      }
      
      const planData = insertTeachingPlanSchema.parse({
        ...req.body,
        createdBy: plan.createdBy // Preserve original creator
      });
      
      // Validate class access for the new class
      if (!validateClassAccess(req, planData.class)) {
        return res.status(403).json({ message: "You don't have permission to create plans for this class" });
      }
      
      const updatedPlan = storage.updateTeachingPlan(id, planData);
      res.json(updatedPlan);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  // Delete teaching plan
  app.delete("/api/plans/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const id = parseInt(req.params.id);
      const plan = storage.getTeachingPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Check if user has permission to delete this plan
      if (req.user.role !== 'admin' && plan.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this teaching plan" });
      }
      
      storage.deleteTeachingPlan(id);
      res.status(200).json({ message: "Teaching plan deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete teaching plan" });
    }
  });

  // -------------------- Teacher Routes (Admin Only) --------------------
  
  // Get all teachers
  app.get("/api/teachers", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can access teacher list" });
    }
    
    try {
      const teachers = storage.getAllTeachers();
      res.json(teachers);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  // -------------------- AI Suggestions --------------------

  // Get or create AI suggestion
  app.post("/api/ai-suggestions", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Check for cached response first
      const cachedSuggestion = storage.getAiSuggestionByPrompt(prompt);
      if (cachedSuggestion) {
        return res.json(cachedSuggestion);
      }
      
      // In a real implementation, we would call the DeepSeek API here
      // For now, return a placeholder response to be replaced with actual API call
      const mockResponse = "Here are some suggested activities:\n1. Color recognition game with flashcards\n2. Storytelling with puppets\n3. Counting exercises with natural objects";
      
      const suggestionData = insertAiSuggestionSchema.parse({
        prompt,
        response: mockResponse
      });
      
      const newSuggestion = storage.createAiSuggestion(suggestionData);
      res.json(newSuggestion);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  // -------------------- Student Assignment (Admin Only) --------------------
  
  // Assign student to teacher (admin only)
  app.put("/api/students/:id/assign", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can assign students to teachers" });
    }
    
    try {
      const studentId = parseInt(req.params.id);
      const { teacherId } = req.body;
      
      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID is required" });
      }
      
      const student = storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      const teacher = storage.getUser(parseInt(teacherId));
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      // Verify the teacher is assigned to the student's class
      if (!teacher.assignedClasses.includes(student.class)) {
        return res.status(400).json({ message: "Teacher is not assigned to the student's class" });
      }
      
      const updatedStudent = storage.updateStudent(studentId, {
        ...student,
        teacherId: parseInt(teacherId)
      });
      
      res.json(updatedStudent);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to assign student to teacher" });
    }
  });

  // -------------------- Statistics (for Dashboard) --------------------
  
  app.get("/api/statistics", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const statistics = {
        totalStudents: 0,
        studentsByClass: {
          Nursery: 0,
          LKG: 0,
          UKG: 0
        },
        totalTeachers: 0,
        totalPlans: 0,
        totalProgressEntries: 0,
        recentActivities: []
      };
      
      if (req.user.role === 'admin') {
        // Admin sees all statistics
        const students = storage.getAllStudents({});
        statistics.totalStudents = students.length;
        
        students.forEach(student => {
          statistics.studentsByClass[student.class as keyof typeof statistics.studentsByClass]++;
        });
        
        statistics.totalTeachers = storage.getAllTeachers().length;
        statistics.totalPlans = storage.getAllTeachingPlans({}).length;
        statistics.totalProgressEntries = storage.getAllProgressEntries().length;
      } else {
        // Teachers see only their statistics
        const students = storage.getStudentsByTeacherId(req.user.id);
        statistics.totalStudents = students.length;
        
        students.forEach(student => {
          statistics.studentsByClass[student.class as keyof typeof statistics.studentsByClass]++;
        });
        
        statistics.totalTeachers = 1; // Just themselves
        statistics.totalPlans = storage.getTeachingPlansByTeacherId(req.user.id, {}).length;
        statistics.totalProgressEntries = storage.getProgressEntriesByTeacherId(req.user.id).length;
      }
      
      res.json(statistics);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
