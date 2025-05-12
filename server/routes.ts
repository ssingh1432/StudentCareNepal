import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import { insertStudentSchema, insertProgressSchema, insertTeachingPlanSchema, insertUserSchema } from "@shared/schema";

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || ""
});

// Setup in-memory storage for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB limit
});

// Middleware to check if user has admin role
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  next();
};

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  next();
};

// Middleware to check if teacher can access specific student
const canAccessStudent = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  // Admin can access all students
  if (req.user.role === 'admin') {
    return next();
  }
  
  const studentId = parseInt(req.params.id);
  const student = await storage.getStudent(studentId);
  
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  
  // Check if student is assigned to this teacher
  if (student.teacherId !== req.user.id) {
    return res.status(403).json({ message: "You don't have access to this student" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Get dashboard statistics
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      let students = [];
      let teachers = [];
      let teachingPlans = [];
      let progressEntries = [];
      
      // Admin gets all data, teachers get only their data
      if (req.user.role === 'admin') {
        students = await storage.getStudents();
        teachers = await storage.getAllTeachers();
        teachingPlans = await storage.getTeachingPlans();
        progressEntries = await storage.progressStore ? Array.from(storage.progressStore.values()) : [];
      } else {
        students = await storage.getStudents({ teacherId: req.user.id });
        teachers = [req.user];
        teachingPlans = await storage.getTeachingPlans({ teacherId: req.user.id });
        const studentIds = students.map(s => s.id);
        progressEntries = Array.from(storage.progressStore.values())
          .filter(p => studentIds.includes(p.studentId));
      }
      
      // Count students by class
      const nurseryCount = students.filter(s => s.class === 'Nursery').length;
      const lkgCount = students.filter(s => s.class === 'LKG').length;
      const ukgCount = students.filter(s => s.class === 'UKG').length;
      
      const stats = {
        totalStudents: students.length,
        teacherCount: teachers.length,
        teachingPlanCount: teachingPlans.length,
        progressEntryCount: progressEntries.length,
        classCounts: {
          nursery: nurseryCount,
          lkg: lkgCount,
          ukg: ukgCount
        }
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving dashboard statistics" });
    }
  });
  
  // Get recent activities
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving recent activities" });
    }
  });
  
  // Teacher management routes (admin only)
  app.get("/api/teachers", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role === 'admin') {
        const teachers = await storage.getAllTeachers();
        // Remove passwords from response
        const teachersWithoutPassword = teachers.map(({ password, ...teacher }) => teacher);
        res.json(teachersWithoutPassword);
      } else {
        // Teachers can only see themselves
        const { password, ...teacherWithoutPassword } = req.user;
        res.json([teacherWithoutPassword]);
      }
    } catch (error) {
      res.status(500).json({ message: "Error retrieving teachers" });
    }
  });
  
  app.post("/api/teachers", isAdmin, async (req, res) => {
    try {
      const parsedData = insertUserSchema.parse(req.body);
      
      // Check if email is already in use
      const existingUser = await storage.getUserByEmail(parsedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Create teacher account
      const teacher = await storage.createUser({
        ...parsedData,
        role: "teacher"
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user.id,
        action: "Teacher Created",
        details: `Admin created teacher account for ${teacher.name}`
      });
      
      // Remove password from response
      const { password, ...teacherWithoutPassword } = teacher;
      res.status(201).json(teacherWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/teachers/:id", isAuthenticated, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      
      // Teachers can only access their own data
      if (req.user.role !== 'admin' && req.user.id !== teacherId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const teacher = await storage.getUser(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      // Remove password from response
      const { password, ...teacherWithoutPassword } = teacher;
      res.json(teacherWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving teacher" });
    }
  });
  
  app.put("/api/teachers/:id", isAdmin, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const teacher = await storage.getUser(teacherId);
      
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const updatedTeacher = await storage.updateUser(teacherId, req.body);
      
      // Create activity
      await storage.createActivity({
        userId: req.user.id,
        action: "Teacher Updated",
        details: `Admin updated teacher account for ${teacher.name}`
      });
      
      // Remove password from response
      const { password, ...teacherWithoutPassword } = updatedTeacher;
      res.json(teacherWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.delete("/api/teachers/:id", isAdmin, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const teacher = await storage.getUser(teacherId);
      
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      await storage.deleteUser(teacherId);
      
      // Create activity
      await storage.createActivity({
        userId: req.user.id,
        action: "Teacher Deleted",
        details: `Admin deleted teacher account for ${teacher.name}`
      });
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting teacher" });
    }
  });
  
  // Student management routes
  app.get("/api/students", isAuthenticated, async (req, res) => {
    try {
      const filters: any = {};
      
      // Apply filters from query parameters
      if (req.query.class) {
        filters.class = req.query.class;
      }
      
      if (req.query.learningAbility) {
        filters.learningAbility = req.query.learningAbility;
      }
      
      // Teachers can only see their assigned students
      if (req.user.role !== 'admin') {
        filters.teacherId = req.user.id;
      } else if (req.query.teacherId) {
        filters.teacherId = parseInt(req.query.teacherId as string);
      }
      
      const students = await storage.getStudents(filters);
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving students" });
    }
  });
  
  app.post("/api/students", isAuthenticated, upload.single('photo'), async (req, res) => {
    try {
      // Parse student data
      const studentData = JSON.parse(req.body.data);
      const parsedData = insertStudentSchema.parse(studentData);
      
      // If teacher is creating, set teacherId to their ID
      if (req.user.role === 'teacher') {
        parsedData.teacherId = req.user.id;
      }
      
      // Upload photo to Cloudinary if provided
      let photoUrl = null;
      if (req.file) {
        // Convert buffer to base64 string
        const base64Data = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64Data}`;
        
        // Upload to Cloudinary
        try {
          const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            folder: 'students',
            resource_type: 'image'
          });
          photoUrl = uploadResponse.secure_url;
        } catch (cloudinaryError) {
          console.error("Cloudinary upload error:", cloudinaryError);
        }
      }
      
      // Create the student with photo URL if available
      const student = await storage.createStudent({
        ...parsedData,
        photoUrl: photoUrl || parsedData.photoUrl
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user.id,
        action: "Student Created",
        details: `${req.user.name} added a new student: ${student.name} (${student.class})`
      });
      
      res.status(201).json(student);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/students/:id", isAuthenticated, canAccessStudent, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving student" });
    }
  });
  
  app.put("/api/students/:id", isAuthenticated, canAccessStudent, upload.single('photo'), async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Parse student data
      const studentData = JSON.parse(req.body.data);
      
      // Upload photo to Cloudinary if provided
      let photoUrl = studentData.photoUrl;
      if (req.file) {
        // Convert buffer to base64 string
        const base64Data = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64Data}`;
        
        // Upload to Cloudinary
        try {
          const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            folder: 'students',
            resource_type: 'image'
          });
          photoUrl = uploadResponse.secure_url;
        } catch (cloudinaryError) {
          console.error("Cloudinary upload error:", cloudinaryError);
        }
      }
      
      // Update the student
      const updatedStudent = await storage.updateStudent(studentId, {
        ...studentData,
        photoUrl
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user.id,
        action: "Student Updated",
        details: `${req.user.name} updated student: ${student.name} (${student.class})`
      });
      
      res.json(updatedStudent);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.delete("/api/students/:id", isAuthenticated, canAccessStudent, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      await storage.deleteStudent(studentId);
      
      // Create activity
      await storage.createActivity({
        userId: req.user.id,
        action: "Student Deleted",
        details: `${req.user.name} deleted student: ${student.name} (${student.class})`
      });
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting student" });
    }
  });
  
  // Assign student to teacher (admin only)
  app.post("/api/students/:studentId/assign/:teacherId", isAdmin, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const teacherId = parseInt(req.params.teacherId);
      
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      const teacher = await storage.getUser(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      // Check if teacher is assigned to the student's class
      if (teacher.assignedClasses && !teacher.assignedClasses.includes(student.class)) {
        return res.status(400).json({ 
          message: `Teacher is not assigned to ${student.class} class`
        });
      }
      
      const success = await storage.assignStudentToTeacher(studentId, teacherId);
      
      if (success) {
        // Create activity
        await storage.createActivity({
          userId: req.user.id,
          action: "Student Assigned",
          details: `Admin assigned student ${student.name} to teacher ${teacher.name}`
        });
        
        res.sendStatus(200);
      } else {
        res.status(400).json({ message: "Failed to assign student to teacher" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error assigning student to teacher" });
    }
  });
  
  // Progress tracking routes
  app.get("/api/progress", isAuthenticated, async (req, res) => {
    try {
      if (req.query.studentId) {
        const studentId = parseInt(req.query.studentId as string);
        const student = await storage.getStudent(studentId);
        
        if (!student) {
          return res.status(404).json({ message: "Student not found" });
        }
        
        // Check if user has access to this student
        if (req.user.role !== 'admin' && student.teacherId !== req.user.id) {
          return res.status(403).json({ message: "You don't have access to this student's progress" });
        }
        
        const progressEntries = await storage.getProgressByStudent(studentId);
        res.json(progressEntries);
      } else if (req.query.class) {
        const className = req.query.class as string;
        
        // Teachers can only see progress for their assigned classes
        if (req.user.role !== 'admin') {
          if (!req.user.assignedClasses?.includes(className)) {
            return res.status(403).json({ 
              message: `You don't have access to ${className} class progress`
            });
          }
        }
        
        const progressEntries = await storage.getProgressByClass(className);
        res.json(progressEntries);
      } else {
        // Return all progress entries user has access to
        let progressEntries = [];
        
        if (req.user.role === 'admin') {
          // Admin can see all progress entries
          progressEntries = Array.from(storage.progressStore.values());
        } else {
          // Teacher can only see progress for their students
          const students = await storage.getStudents({ teacherId: req.user.id });
          const studentIds = students.map(s => s.id);
          progressEntries = Array.from(storage.progressStore.values())
            .filter(p => studentIds.includes(p.studentId));
        }
        
        res.json(progressEntries);
      }
    } catch (error) {
      res.status(500).json({ message: "Error retrieving progress entries" });
    }
  });
  
  app.post("/api/progress", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertProgressSchema.parse(req.body);
      
      // Verify student exists
      const student = await storage.getStudent(parsedData.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Verify user has access to this student
      if (req.user.role !== 'admin' && student.teacherId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this student" });
      }
      
      // Add teacherId to the progress entry
      const progressEntry = await storage.createProgress({
        ...parsedData,
        teacherId: req.user.id
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user.id,
        action: "Progress Recorded",
        details: `${req.user.name} recorded progress for student: ${student.name}`
      });
      
      res.status(201).json(progressEntry);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/progress/:id", isAuthenticated, async (req, res) => {
    try {
      const progressId = parseInt(req.params.id);
      const progressEntry = await storage.getProgress(progressId);
      
      if (!progressEntry) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      
      // Check if user has access to this progress entry
      if (req.user.role !== 'admin' && progressEntry.teacherId !== req.user.id) {
        const student = await storage.getStudent(progressEntry.studentId);
        if (!student || student.teacherId !== req.user.id) {
          return res.status(403).json({ message: "You don't have access to this progress entry" });
        }
      }
      
      res.json(progressEntry);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving progress entry" });
    }
  });
  
  app.put("/api/progress/:id", isAuthenticated, async (req, res) => {
    try {
      const progressId = parseInt(req.params.id);
      const progressEntry = await storage.getProgress(progressId);
      
      if (!progressEntry) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      
      // Check if user has access to this progress entry
      if (req.user.role !== 'admin' && progressEntry.teacherId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this progress entry" });
      }
      
      const updatedProgress = await storage.updateProgress(progressId, req.body);
      
      // Create activity
      const student = await storage.getStudent(progressEntry.studentId);
      await storage.createActivity({
        userId: req.user.id,
        action: "Progress Updated",
        details: `${req.user.name} updated progress for student: ${student?.name || 'Unknown'}`
      });
      
      res.json(updatedProgress);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.delete("/api/progress/:id", isAuthenticated, async (req, res) => {
    try {
      const progressId = parseInt(req.params.id);
      const progressEntry = await storage.getProgress(progressId);
      
      if (!progressEntry) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      
      // Check if user has access to this progress entry
      if (req.user.role !== 'admin' && progressEntry.teacherId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this progress entry" });
      }
      
      await storage.deleteProgress(progressId);
      
      // Create activity
      const student = await storage.getStudent(progressEntry.studentId);
      await storage.createActivity({
        userId: req.user.id,
        action: "Progress Deleted",
        details: `${req.user.name} deleted progress for student: ${student?.name || 'Unknown'}`
      });
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting progress entry" });
    }
  });
  
  // Teaching plan routes
  app.get("/api/teaching-plans", isAuthenticated, async (req, res) => {
    try {
      const filters: any = {};
      
      // Apply filters from query parameters
      if (req.query.type) {
        filters.type = req.query.type;
      }
      
      if (req.query.class) {
        filters.class = req.query.class;
      }
      
      // Teachers can only see their plans
      if (req.user.role !== 'admin') {
        filters.teacherId = req.user.id;
      } else if (req.query.teacherId) {
        filters.teacherId = parseInt(req.query.teacherId as string);
      }
      
      const plans = await storage.getTeachingPlans(filters);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving teaching plans" });
    }
  });
  
  app.post("/api/teaching-plans", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertTeachingPlanSchema.parse(req.body);
      
      // Teachers can only create plans for their assigned classes
      if (req.user.role !== 'admin') {
        if (!req.user.assignedClasses?.includes(parsedData.class)) {
          return res.status(403).json({ 
            message: `You don't have access to create plans for ${parsedData.class} class`
          });
        }
      }
      
      // Add teacherId to the plan
      const plan = await storage.createTeachingPlan({
        ...parsedData,
        teacherId: req.user.id
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user.id,
        action: "Teaching Plan Created",
        details: `${req.user.name} created a ${plan.type} plan for ${plan.class}: ${plan.title}`
      });
      
      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/teaching-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getTeachingPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Check if user has access to this plan
      if (req.user.role !== 'admin' && plan.teacherId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this teaching plan" });
      }
      
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving teaching plan" });
    }
  });
  
  app.put("/api/teaching-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getTeachingPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Check if user has access to this plan
      if (req.user.role !== 'admin' && plan.teacherId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this teaching plan" });
      }
      
      const updatedPlan = await storage.updateTeachingPlan(planId, req.body);
      
      // Create activity
      await storage.createActivity({
        userId: req.user.id,
        action: "Teaching Plan Updated",
        details: `${req.user.name} updated the ${plan.type} plan for ${plan.class}: ${plan.title}`
      });
      
      res.json(updatedPlan);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.delete("/api/teaching-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getTeachingPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Teaching plan not found" });
      }
      
      // Check if user has access to this plan
      if (req.user.role !== 'admin' && plan.teacherId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this teaching plan" });
      }
      
      await storage.deleteTeachingPlan(planId);
      
      // Create activity
      await storage.createActivity({
        userId: req.user.id,
        action: "Teaching Plan Deleted",
        details: `${req.user.name} deleted the ${plan.type} plan for ${plan.class}: ${plan.title}`
      });
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting teaching plan" });
    }
  });
  
  // DeepSeek AI suggestions endpoint
  app.post("/api/ai-suggestions", isAuthenticated, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Check if we have the DeepSeek API key
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ 
          message: "AI suggestions are not available: API key not configured"
        });
      }
      
      try {
        // Call the DeepSeek API (using compatible OpenAI format)
        const response = await axios.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: "deepseek-v3",
            messages: [
              {
                role: "system",
                content: "You are an educational assistant for pre-primary teachers in Nepal. Generate thoughtful, age-appropriate activities and suggestions for pre-primary (Nursery, LKG, UKG) students aged 3-5 years."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          }
        );
        
        // Return the AI-generated content
        res.json({ 
          success: true, 
          suggestions: response.data.choices[0].message.content 
        });
      } catch (apiError) {
        console.error("DeepSeek API error:", apiError.response?.data || apiError.message);
        res.status(500).json({ 
          message: "Error generating AI suggestions",
          error: apiError.response?.data?.error?.message || apiError.message
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Error processing AI suggestion request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
