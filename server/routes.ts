import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { uploadImage } from "./cloudinary";
import { getAISuggestions } from "./deepseek";
import { generatePdf } from "./pdf";
import { generateExcel } from "./excel";
import multer from "multer";
import path from "path";
import { insertStudentSchema, insertProgressSchema, insertTeachingPlanSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for temporary file storage
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), 'temp'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 1024 * 1024 } // 1MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Check if user is admin
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user?.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Student routes
  app.get("/api/students", isAuthenticated, async (req, res) => {
    try {
      const students = await storage.getStudents(req.user!.id, req.user!.role === "admin");
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const student = await storage.getStudentById(parseInt(req.params.id));
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check if teacher has access to this student
      if (req.user!.role !== "admin" && student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this student" });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", isAuthenticated, upload.single('photo'), async (req, res) => {
    try {
      const studentData = JSON.parse(req.body.data);
      
      // Validate student data
      const validatedData = insertStudentSchema.parse(studentData);
      
      // If photo was uploaded, process with Cloudinary
      let photoUrl = undefined;
      if (req.file) {
        photoUrl = await uploadImage(req.file.path, 'students');
      }
      
      // Create student with processed data
      const student = await storage.createStudent({
        ...validatedData,
        photoUrl,
        teacherId: parseInt(studentData.teacherId)
      });
      
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", isAuthenticated, upload.single('photo'), async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const studentData = JSON.parse(req.body.data);
      
      // Validate student data
      const validatedData = insertStudentSchema.parse(studentData);
      
      // Check if student exists and user has access
      const existingStudent = await storage.getStudentById(studentId);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (req.user!.role !== "admin" && existingStudent.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this student" });
      }
      
      // If photo was uploaded, process with Cloudinary
      let photoUrl = existingStudent.photoUrl;
      if (req.file) {
        photoUrl = await uploadImage(req.file.path, 'students');
      }
      
      // Update student with processed data
      const student = await storage.updateStudent(studentId, {
        ...validatedData,
        photoUrl,
        teacherId: parseInt(studentData.teacherId)
      });
      
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      
      // Check if student exists and user has access
      const existingStudent = await storage.getStudentById(studentId);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (req.user!.role !== "admin" && existingStudent.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this student" });
      }
      
      await storage.deleteStudent(studentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Progress tracking routes
  app.get("/api/progress/:studentId", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      // Check if student exists and user has access
      const student = await storage.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (req.user!.role !== "admin" && student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this student" });
      }
      
      const progressEntries = await storage.getStudentProgress(studentId);
      res.json(progressEntries);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", isAuthenticated, async (req, res) => {
    try {
      // Validate progress data
      const validatedData = insertProgressSchema.parse(req.body);
      
      // Check if student exists and user has access
      const student = await storage.getStudentById(validatedData.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (req.user!.role !== "admin" && student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this student" });
      }
      
      const progress = await storage.createProgress(validatedData);
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error creating progress:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid progress data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create progress" });
    }
  });

  app.put("/api/progress/:id", isAuthenticated, async (req, res) => {
    try {
      const progressId = parseInt(req.params.id);
      
      // Validate progress data
      const validatedData = insertProgressSchema.parse(req.body);
      
      // Check if progress exists
      const existingProgress = await storage.getProgressById(progressId);
      if (!existingProgress) {
        return res.status(404).json({ message: "Progress not found" });
      }
      
      // Check if student exists and user has access
      const student = await storage.getStudentById(validatedData.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (req.user!.role !== "admin" && student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this student" });
      }
      
      const progress = await storage.updateProgress(progressId, validatedData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid progress data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.delete("/api/progress/:id", isAuthenticated, async (req, res) => {
    try {
      const progressId = parseInt(req.params.id);
      
      // Check if progress exists
      const existingProgress = await storage.getProgressById(progressId);
      if (!existingProgress) {
        return res.status(404).json({ message: "Progress not found" });
      }
      
      // Check if student exists and user has access
      const student = await storage.getStudentById(existingProgress.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (req.user!.role !== "admin" && student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this student" });
      }
      
      await storage.deleteProgress(progressId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting progress:", error);
      res.status(500).json({ message: "Failed to delete progress" });
    }
  });

  // Teaching plan routes
  app.get("/api/teaching-plans", isAuthenticated, async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const classLevel = req.query.class as string | undefined;
      
      const plans = await storage.getTeachingPlans(req.user!.id, req.user!.role === "admin", type, classLevel);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching teaching plans:", error);
      res.status(500).json({ message: "Failed to fetch teaching plans" });
    }
  });

  app.get("/api/teaching-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      
      const plan = await storage.getTeachingPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Check if teacher has access to this plan (created by them or is admin)
      if (req.user!.role !== "admin" && plan.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this teaching plan" });
      }
      
      res.json(plan);
    } catch (error) {
      console.error("Error fetching teaching plan:", error);
      res.status(500).json({ message: "Failed to fetch teaching plan" });
    }
  });

  app.post("/api/teaching-plans", isAuthenticated, async (req, res) => {
    try {
      // Validate plan data
      const validatedData = insertTeachingPlanSchema.parse(req.body);
      
      // Create plan
      const plan = await storage.createTeachingPlan({
        ...validatedData,
        createdBy: req.user!.id
      });
      
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating teaching plan:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid teaching plan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create teaching plan" });
    }
  });

  app.put("/api/teaching-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      
      // Validate plan data
      const validatedData = insertTeachingPlanSchema.parse(req.body);
      
      // Check if plan exists
      const existingPlan = await storage.getTeachingPlanById(planId);
      if (!existingPlan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Check if teacher has access to this plan (created by them or is admin)
      if (req.user!.role !== "admin" && existingPlan.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this teaching plan" });
      }
      
      const plan = await storage.updateTeachingPlan(planId, {
        ...validatedData,
        createdBy: existingPlan.createdBy
      });
      
      res.json(plan);
    } catch (error) {
      console.error("Error updating teaching plan:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid teaching plan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update teaching plan" });
    }
  });

  app.delete("/api/teaching-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      
      // Check if plan exists
      const existingPlan = await storage.getTeachingPlanById(planId);
      if (!existingPlan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Check if teacher has access to this plan (created by them or is admin)
      if (req.user!.role !== "admin" && existingPlan.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this teaching plan" });
      }
      
      await storage.deleteTeachingPlan(planId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting teaching plan:", error);
      res.status(500).json({ message: "Failed to delete teaching plan" });
    }
  });

  // DeepSeek AI suggestions route
  app.post("/api/ai-suggestions", isAuthenticated, async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const suggestions = await getAISuggestions(prompt);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      res.status(500).json({ message: "Failed to get AI suggestions" });
    }
  });

  // Teacher management routes (admin only)
  app.get("/api/teachers", isAuthenticated, async (req, res) => {
    try {
      // Non-admin users can only see basic info of teachers, not manage them
      const teachers = await storage.getTeachers();
      
      // Filter sensitive information for non-admin users
      const safeTeachers = teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        assignedClasses: teacher.assignedClasses,
        ...(req.user!.role === "admin" ? { email: teacher.email } : {})
      }));
      
      res.json(safeTeachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.post("/api/teachers", isAdmin, async (req, res) => {
    try {
      const { email, password, name, assignedClasses } = req.body;
      
      // Create new teacher
      const teacher = await storage.createUser({
        email,
        password,
        role: "teacher",
        name,
        assignedClasses
      });
      
      res.status(201).json({
        id: teacher.id,
        email: teacher.email,
        name: teacher.name,
        role: teacher.role,
        assignedClasses: teacher.assignedClasses
      });
    } catch (error) {
      console.error("Error creating teacher:", error);
      res.status(500).json({ message: "Failed to create teacher" });
    }
  });

  app.put("/api/teachers/:id", isAdmin, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const { email, password, name, assignedClasses } = req.body;
      
      // Check if teacher exists
      const existingTeacher = await storage.getUser(teacherId);
      if (!existingTeacher || existingTeacher.role !== "teacher") {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      // Update teacher
      const teacher = await storage.updateUser(teacherId, {
        email,
        password,
        role: "teacher",
        name,
        assignedClasses
      });
      
      res.json({
        id: teacher.id,
        email: teacher.email,
        name: teacher.name,
        role: teacher.role,
        assignedClasses: teacher.assignedClasses
      });
    } catch (error) {
      console.error("Error updating teacher:", error);
      res.status(500).json({ message: "Failed to update teacher" });
    }
  });

  app.delete("/api/teachers/:id", isAdmin, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      
      // Check if teacher exists
      const existingTeacher = await storage.getUser(teacherId);
      if (!existingTeacher || existingTeacher.role !== "teacher") {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      // Delete teacher
      await storage.deleteUser(teacherId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      res.status(500).json({ message: "Failed to delete teacher" });
    }
  });

  // Student assignment route (admin only)
  app.put("/api/assign-student/:studentId", isAdmin, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const { teacherId } = req.body;
      
      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID is required" });
      }
      
      // Check if student exists
      const student = await storage.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check if teacher exists
      const teacher = await storage.getUser(teacherId);
      if (!teacher || teacher.role !== "teacher") {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      // Update student's teacher
      const updatedStudent = await storage.updateStudent(studentId, {
        ...student,
        teacherId
      });
      
      res.json(updatedStudent);
    } catch (error) {
      console.error("Error assigning student:", error);
      res.status(500).json({ message: "Failed to assign student" });
    }
  });

  // Report generation routes
  app.post("/api/reports/pdf", isAuthenticated, async (req, res) => {
    try {
      const { type, classLevel, teacherId, startDate, endDate, includePhotos } = req.body;
      
      if (!type) {
        return res.status(400).json({ message: "Report type is required" });
      }
      
      let data;
      if (type === "student-progress") {
        data = await storage.getProgressReport(req.user!.id, req.user!.role === "admin", classLevel, teacherId, startDate, endDate);
      } else if (type === "teaching-plan") {
        data = await storage.getTeachingPlanReport(req.user!.id, req.user!.role === "admin", classLevel, teacherId);
      } else {
        return res.status(400).json({ message: "Invalid report type" });
      }
      
      const pdfBuffer = await generatePdf(type, data, includePhotos);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({ message: "Failed to generate PDF report" });
    }
  });

  app.post("/api/reports/excel", isAuthenticated, async (req, res) => {
    try {
      const { type, classLevel, teacherId, startDate, endDate } = req.body;
      
      if (!type) {
        return res.status(400).json({ message: "Report type is required" });
      }
      
      let data;
      if (type === "student-progress") {
        data = await storage.getProgressReport(req.user!.id, req.user!.role === "admin", classLevel, teacherId, startDate, endDate);
      } else if (type === "teaching-plan") {
        data = await storage.getTeachingPlanReport(req.user!.id, req.user!.role === "admin", classLevel, teacherId);
      } else {
        return res.status(400).json({ message: "Invalid report type" });
      }
      
      const excelBuffer = await generateExcel(type, data);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error generating Excel report:", error);
      res.status(500).json({ message: "Failed to generate Excel report" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
