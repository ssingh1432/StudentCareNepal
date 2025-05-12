import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { insertStudentSchema, insertProgressSchema, insertTeachingPlanSchema, User } from "@shared/schema";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Setup Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
  });
  
  // Setup multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 1024 * 1024, // 1 MB max file size
    },
    fileFilter: (req, file, cb) => {
      // Accept only jpeg and png
      if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
      } else {
        cb(null, false);
      }
    }
  });

  // Teachers API
  app.get("/api/teachers", async (req, res) => {
    try {
      const teachers = await storage.getAllTeachers();
      const teachersWithoutPassword = teachers.map(({ password, ...teacher }) => teacher);
      res.json(teachersWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.post("/api/admin/teachers", async (req, res) => {
    try {
      const teacherData = req.body;
      const newTeacher = await storage.createUser({
        ...teacherData,
        role: "teacher",
      });
      
      const { password, ...teacherWithoutPassword } = newTeacher;
      res.status(201).json(teacherWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to create teacher" });
    }
  });

  app.put("/api/admin/teachers/:id", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const teacherData = req.body;
      
      const updatedTeacher = await storage.updateUser(teacherId, teacherData);
      if (!updatedTeacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const { password, ...teacherWithoutPassword } = updatedTeacher;
      res.json(teacherWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update teacher" });
    }
  });

  app.delete("/api/admin/teachers/:id", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const success = await storage.deleteUser(teacherId);
      
      if (!success) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete teacher" });
    }
  });

  // Students API
  app.get("/api/students", async (req, res) => {
    try {
      const user = req.user as User;
      let students = [];
      
      if (user.role === "admin") {
        // Admin can see all students
        students = await storage.getAllStudents();
      } else {
        // Teachers can see only their assigned students
        students = await storage.getStudentsByTeacher(user.id);
      }
      
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check if user has access to this student
      const user = req.user as User;
      if (user.role !== "admin" && student.teacherId !== user.id) {
        return res.status(403).json({ message: "You don't have access to this student" });
      }
      
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", upload.single("photo"), async (req, res) => {
    try {
      const studentData = JSON.parse(req.body.data);
      
      // Validate student data
      const parseResult = insertStudentSchema.safeParse(studentData);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.message });
      }
      
      // Upload photo to Cloudinary if provided
      let photoUrl = undefined;
      let photoPublicId = undefined;
      
      if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        try {
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: "students",
            resource_type: "image",
          });
          
          photoUrl = result.secure_url;
          photoPublicId = result.public_id;
        } catch (cloudinaryError) {
          console.error("Cloudinary upload error:", cloudinaryError);
          // Continue without photo if upload fails
        }
      }
      
      // Create student with photo if available
      const student = await storage.createStudent({
        ...studentData,
        photoUrl,
        photoPublicId,
      });
      
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", upload.single("photo"), async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const studentData = JSON.parse(req.body.data);
      
      // Check if student exists
      const existingStudent = await storage.getStudent(studentId);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check permissions
      const user = req.user as User;
      if (user.role !== "admin" && existingStudent.teacherId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this student" });
      }
      
      // Upload new photo if provided
      let photoUrl = existingStudent.photoUrl;
      let photoPublicId = existingStudent.photoPublicId;
      
      if (req.file) {
        // Delete old photo if exists
        if (existingStudent.photoPublicId) {
          try {
            await cloudinary.uploader.destroy(existingStudent.photoPublicId);
          } catch (error) {
            console.error("Error deleting old photo:", error);
          }
        }
        
        // Upload new photo
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        try {
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: "students",
            resource_type: "image",
          });
          
          photoUrl = result.secure_url;
          photoPublicId = result.public_id;
        } catch (cloudinaryError) {
          console.error("Cloudinary upload error:", cloudinaryError);
          // Keep old photo if upload fails
        }
      }
      
      // Update student
      const updatedStudent = await storage.updateStudent(studentId, {
        ...studentData,
        photoUrl,
        photoPublicId,
      });
      
      res.json(updatedStudent);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      
      // Check if student exists
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check permissions
      const user = req.user as User;
      if (user.role !== "admin" && student.teacherId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this student" });
      }
      
      // Delete photo from Cloudinary if exists
      if (student.photoPublicId) {
        try {
          await cloudinary.uploader.destroy(student.photoPublicId);
        } catch (error) {
          console.error("Error deleting photo:", error);
        }
      }
      
      // Delete student
      await storage.deleteStudent(studentId);
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Assign student to teacher (admin only)
  app.post("/api/admin/assign-student", async (req, res) => {
    try {
      const { studentId, teacherId } = req.body;
      
      if (!studentId || !teacherId) {
        return res.status(400).json({ message: "Student ID and Teacher ID are required" });
      }
      
      const success = await storage.assignStudentToTeacher(studentId, teacherId);
      
      if (!success) {
        return res.status(404).json({ message: "Student or teacher not found" });
      }
      
      res.status(200).json({ message: "Student assigned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign student" });
    }
  });

  // Progress API
  app.get("/api/progress/student/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      // Check if student exists
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check permissions
      const user = req.user as User;
      if (user.role !== "admin" && student.teacherId !== user.id) {
        return res.status(403).json({ message: "You don't have access to this student's progress" });
      }
      
      const progressEntries = await storage.getProgressByStudent(studentId);
      res.json(progressEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", async (req, res) => {
    try {
      const progressData = req.body;
      
      // Validate progress data
      const parseResult = insertProgressSchema.safeParse(progressData);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.message });
      }
      
      // Check if student exists
      const student = await storage.getStudent(progressData.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check permissions
      const user = req.user as User;
      if (user.role !== "admin" && student.teacherId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to add progress for this student" });
      }
      
      // Create progress with current user as creator
      const progress = await storage.createProgress({
        ...progressData,
        createdBy: user.id,
      });
      
      res.status(201).json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to create progress entry" });
    }
  });

  app.put("/api/progress/:id", async (req, res) => {
    try {
      const progressId = parseInt(req.params.id);
      const progressData = req.body;
      
      // Check if progress exists
      const existingProgress = await storage.getProgressById(progressId);
      if (!existingProgress) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      
      // Check permissions
      const user = req.user as User;
      if (user.role !== "admin" && existingProgress.createdBy !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this progress entry" });
      }
      
      // Update progress
      const updatedProgress = await storage.updateProgress(progressId, progressData);
      
      res.json(updatedProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress entry" });
    }
  });

  app.delete("/api/progress/:id", async (req, res) => {
    try {
      const progressId = parseInt(req.params.id);
      
      // Check if progress exists
      const progress = await storage.getProgressById(progressId);
      if (!progress) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      
      // Check permissions
      const user = req.user as User;
      if (user.role !== "admin" && progress.createdBy !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this progress entry" });
      }
      
      // Delete progress
      await storage.deleteProgress(progressId);
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete progress entry" });
    }
  });

  // Teaching Plans API
  app.get("/api/teaching-plans", async (req, res) => {
    try {
      const user = req.user as User;
      let plans = [];
      
      // Filter parameters
      const classFilter = req.query.class as string;
      const typeFilter = req.query.type as string;
      
      if (user.role === "admin") {
        // Admin can see all plans
        plans = await storage.getAllTeachingPlans();
      } else {
        // Teachers can see only their plans
        plans = await storage.getTeachingPlansByCreator(user.id);
      }
      
      // Apply filters if provided
      if (classFilter) {
        plans = plans.filter(plan => plan.class === classFilter);
      }
      
      if (typeFilter) {
        plans = plans.filter(plan => plan.type === typeFilter);
      }
      
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teaching plans" });
    }
  });

  app.get("/api/teaching-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getTeachingPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Check permissions
      const user = req.user as User;
      if (user.role !== "admin" && plan.createdBy !== user.id) {
        return res.status(403).json({ message: "You don't have access to this teaching plan" });
      }
      
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teaching plan" });
    }
  });

  app.post("/api/teaching-plans", async (req, res) => {
    try {
      const planData = req.body;
      
      // Validate plan data
      const parseResult = insertTeachingPlanSchema.safeParse(planData);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.message });
      }
      
      // Create plan with current user as creator
      const user = req.user as User;
      const plan = await storage.createTeachingPlan({
        ...planData,
        createdBy: user.id,
      });
      
      res.status(201).json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to create teaching plan" });
    }
  });

  app.put("/api/teaching-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const planData = req.body;
      
      // Check if plan exists
      const existingPlan = await storage.getTeachingPlan(planId);
      if (!existingPlan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Check permissions
      const user = req.user as User;
      if (user.role !== "admin" && existingPlan.createdBy !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this teaching plan" });
      }
      
      // Update plan
      const updatedPlan = await storage.updateTeachingPlan(planId, planData);
      
      res.json(updatedPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update teaching plan" });
    }
  });

  app.delete("/api/teaching-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      
      // Check if plan exists
      const plan = await storage.getTeachingPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Check permissions
      const user = req.user as User;
      if (user.role !== "admin" && plan.createdBy !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this teaching plan" });
      }
      
      // Delete plan
      await storage.deleteTeachingPlan(planId);
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete teaching plan" });
    }
  });

  // DeepSeek AI Suggestions API
  app.post("/api/ai-suggestions", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Check if we have a cached suggestion
      const cachedSuggestion = await storage.getAiSuggestionByPrompt(prompt);
      if (cachedSuggestion) {
        return res.json({ suggestion: cachedSuggestion.response });
      }
      
      // Make a request to DeepSeek API
      const apiKey = process.env.DEEPSEEK_API_KEY || "";
      if (!apiKey) {
        return res.status(503).json({ message: "DeepSeek API key is not configured" });
      }
      
      try {
        const response = await axios.post(
          "https://api.deepseek.com/v1/chat/completions",
          {
            model: "deepseek-v3", 
            messages: [
              { 
                role: "user", 
                content: prompt
              }
            ],
            temperature: 0.7
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            }
          }
        );
        
        const suggestion = response.data?.choices[0]?.message?.content || "No suggestion available.";
        
        // Cache the suggestion
        await storage.createAiSuggestion({
          prompt,
          response: suggestion
        });
        
        res.json({ suggestion });
      } catch (apiError: any) {
        console.error("DeepSeek API error:", apiError.response?.data || apiError.message);
        res.status(503).json({ message: "Failed to get AI suggestions. Try again later." });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to process AI suggestion request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
