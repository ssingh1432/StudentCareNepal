import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertStudentSchema, insertProgressSchema, insertTeachingPlanSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import axios from "axios";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

// Setup file upload middleware
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024, // 1MB limit
  }
});

// Role-based authorization middleware
const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    
    next();
  };
};

// Teacher can only access their assigned students middleware
const canAccessStudent = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  const studentId = parseInt(req.params.id);
  if (isNaN(studentId)) {
    return res.status(400).json({ message: "Invalid student ID" });
  }
  
  const student = await storage.getStudent(studentId);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  
  if (student.teacherId !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized access to this student" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  const httpServer = createServer(app);
  
  // Teacher routes
  app.get("/api/teachers", authorize(['admin']), async (req, res) => {
    try {
      const teachers = await storage.getTeachers();
      res.json(teachers.map(({ password, ...teacher }) => teacher));
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve teachers" });
    }
  });
  
  app.post("/api/teachers", authorize(['admin']), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const teacher = await storage.createUser(validatedData);
      const { password, ...teacherWithoutPassword } = teacher;
      res.status(201).json(teacherWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create teacher" });
    }
  });
  
  app.put("/api/teachers/:id", authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      
      const teacher = await storage.getUser(id);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const updatedTeacher = await storage.updateUser(id, req.body);
      if (!updatedTeacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const { password, ...teacherWithoutPassword } = updatedTeacher;
      res.json(teacherWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update teacher" });
    }
  });
  
  app.delete("/api/teachers/:id", authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      
      const teacher = await storage.getUser(id);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const result = await storage.deleteUser(id);
      if (!result) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete teacher" });
    }
  });
  
  // Student routes
  app.get("/api/students", async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.class) {
        filters.class = req.query.class as string;
      }
      
      if (req.query.learningAbility) {
        filters.learningAbility = req.query.learningAbility as string;
      }
      
      // If teacher, only return their students
      if (req.isAuthenticated() && req.user.role === 'teacher') {
        filters.teacherId = req.user.id;
      } else if (req.query.teacherId) {
        filters.teacherId = parseInt(req.query.teacherId as string);
      }
      
      const students = await storage.getStudents(filters);
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve students" });
    }
  });
  
  app.post("/api/students", authorize(['admin', 'teacher']), upload.single('photo'), async (req, res) => {
    try {
      let photoUrl = req.body.photoUrl || '';
      
      // Upload photo to Cloudinary if provided
      if (req.file) {
        try {
          const base64Image = req.file.buffer.toString('base64');
          const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${base64Image}`,
            { folder: 'students' }
          );
          photoUrl = result.secure_url;
        } catch (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ message: "Failed to upload photo" });
        }
      }
      
      // Assign teacher ID based on user role
      let teacherId = parseInt(req.body.teacherId);
      if (isNaN(teacherId) && req.user.role === 'teacher') {
        teacherId = req.user.id;
      }
      
      const data = { ...req.body, photoUrl, teacherId };
      const validatedData = insertStudentSchema.parse(data);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });
  
  app.get("/api/students/:id", canAccessStudent, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      const student = await storage.getStudent(id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve student" });
    }
  });
  
  app.put("/api/students/:id", canAccessStudent, upload.single('photo'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      // Upload new photo if provided
      if (req.file) {
        try {
          const base64Image = req.file.buffer.toString('base64');
          const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${base64Image}`,
            { folder: 'students' }
          );
          req.body.photoUrl = result.secure_url;
        } catch (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ message: "Failed to upload photo" });
        }
      }
      
      const updatedStudent = await storage.updateStudent(id, req.body);
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(updatedStudent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update student" });
    }
  });
  
  app.delete("/api/students/:id", canAccessStudent, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      const result = await storage.deleteStudent(id);
      if (!result) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });
  
  // Student assignment route (admin only)
  app.post("/api/students/:id/assign", authorize(['admin']), async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const teacherId = parseInt(req.body.teacherId);
      
      if (isNaN(studentId) || isNaN(teacherId)) {
        return res.status(400).json({ message: "Invalid student or teacher ID" });
      }
      
      const result = await storage.assignStudentToTeacher(studentId, teacherId);
      if (!result) {
        return res.status(404).json({ message: "Student or teacher not found" });
      }
      
      res.status(200).json({ message: "Student assigned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign student" });
    }
  });
  
  // Progress routes
  app.get("/api/progress/:studentId", canAccessStudent, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      const progress = await storage.getProgressByStudent(studentId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve progress" });
    }
  });
  
  app.post("/api/progress", authorize(['admin', 'teacher']), async (req, res) => {
    try {
      const validatedData = insertProgressSchema.parse(req.body);
      
      // Verify teacher has access to this student
      if (req.user.role === 'teacher') {
        const student = await storage.getStudent(validatedData.studentId);
        if (!student || student.teacherId !== req.user.id) {
          return res.status(403).json({ message: "Unauthorized access to this student" });
        }
      }
      
      const progress = await storage.createProgress(validatedData);
      res.status(201).json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create progress entry" });
    }
  });
  
  app.put("/api/progress/:id", authorize(['admin', 'teacher']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid progress ID" });
      }
      
      const progress = await storage.getProgress(id);
      if (!progress) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      
      // Verify teacher has access to this student
      if (req.user.role === 'teacher') {
        const student = await storage.getStudent(progress.studentId);
        if (!student || student.teacherId !== req.user.id) {
          return res.status(403).json({ message: "Unauthorized access to this student's progress" });
        }
      }
      
      const updatedProgress = await storage.updateProgress(id, req.body);
      if (!updatedProgress) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      
      res.json(updatedProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress entry" });
    }
  });
  
  app.delete("/api/progress/:id", authorize(['admin', 'teacher']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid progress ID" });
      }
      
      const progress = await storage.getProgress(id);
      if (!progress) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      
      // Verify teacher has access to this student
      if (req.user.role === 'teacher') {
        const student = await storage.getStudent(progress.studentId);
        if (!student || student.teacherId !== req.user.id) {
          return res.status(403).json({ message: "Unauthorized access to this student's progress" });
        }
      }
      
      const result = await storage.deleteProgress(id);
      if (!result) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete progress entry" });
    }
  });
  
  // Teaching Plan routes
  app.get("/api/teaching-plans", async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.type) {
        filters.type = req.query.type as string;
      }
      
      if (req.query.class) {
        filters.class = req.query.class as string;
      }
      
      // If teacher, only return their plans
      if (req.isAuthenticated() && req.user.role === 'teacher') {
        filters.teacherId = req.user.id;
      } else if (req.query.teacherId) {
        filters.teacherId = parseInt(req.query.teacherId as string);
      }
      
      const plans = await storage.getTeachingPlans(filters);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve teaching plans" });
    }
  });
  
  app.post("/api/teaching-plans", authorize(['admin', 'teacher']), async (req, res) => {
    try {
      // Set teacher ID based on user role
      let data = { ...req.body };
      if (req.user.role === 'teacher') {
        data.teacherId = req.user.id;
      }
      
      const validatedData = insertTeachingPlanSchema.parse(data);
      const plan = await storage.createTeachingPlan(validatedData);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create teaching plan" });
    }
  });
  
  app.get("/api/teaching-plans/:id", authorize(['admin', 'teacher']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }
      
      const plan = await storage.getTeachingPlan(id);
      if (!plan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Verify teacher has access to this plan
      if (req.user.role === 'teacher' && plan.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to this teaching plan" });
      }
      
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve teaching plan" });
    }
  });
  
  app.put("/api/teaching-plans/:id", authorize(['admin', 'teacher']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }
      
      const plan = await storage.getTeachingPlan(id);
      if (!plan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Verify teacher has access to this plan
      if (req.user.role === 'teacher' && plan.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to this teaching plan" });
      }
      
      const updatedPlan = await storage.updateTeachingPlan(id, req.body);
      if (!updatedPlan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      res.json(updatedPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update teaching plan" });
    }
  });
  
  app.delete("/api/teaching-plans/:id", authorize(['admin', 'teacher']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }
      
      const plan = await storage.getTeachingPlan(id);
      if (!plan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Verify teacher has access to this plan
      if (req.user.role === 'teacher' && plan.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to this teaching plan" });
      }
      
      const result = await storage.deleteTeachingPlan(id);
      if (!result) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete teaching plan" });
    }
  });
  
  // DeepSeek API Integration for AI suggestions
  app.post("/api/ai-suggestions", authorize(['admin', 'teacher']), async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const apiKey = process.env.DEEPSEEK_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ message: "DeepSeek API key not configured" });
      }
      
      try {
        const response = await axios.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: 'deepseek-v3',
            messages: [
              { role: 'system', content: 'You are an expert pre-primary education specialist. Provide teaching plan activities and suggestions that are age-appropriate, engaging, and aligned with educational goals for young children.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 1000
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          }
        );
        
        const suggestion = response.data.choices[0].message.content;
        res.json({ suggestion });
      } catch (error: any) {
        console.error('DeepSeek API error:', error.response?.data || error.message);
        res.status(500).json({ message: "Failed to get AI suggestions" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  return httpServer;
}
