import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { loginSchema, insertUserSchema, insertStudentSchema, insertProgressEntrySchema, insertTeachingPlanSchema, insertTeacherClassSchema } from "@shared/schema";
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Configure Cloudinary if API key is available
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Configure JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'nepal_central_high_school_secret';

// Configure temporary upload directory for multer
const uploadDir = os.tmpdir();
const upload = multer({ dest: uploadDir });

// Type for decoded JWT payload
interface JwtPayload {
  userId: number;
  role: string;
}

// Middleware for parsing validation errors
const handleErrors = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors
    });
  }
  next(err);
};

// Middleware to check authentication
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid user' });
    }
    
    // Attach user to request for use in other middleware/routes
    (req as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check admin role
const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Middleware to check if a teacher can access specific data
const teacherAccessCheck = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user.role === 'admin') {
    return next(); // Admin has access to everything
  }

  // For student or progress access
  const resourceId = parseInt(req.params.id || '0');
  const resourceType = req.path.includes('students') ? 'student' : 
                       req.path.includes('progress') ? 'progress' :
                       req.path.includes('plans') ? 'plan' : '';

  if (!resourceId || !resourceType) {
    return next(); // If no specific resource is being accessed
  }

  try {
    if (resourceType === 'student') {
      const student = await storage.getStudent(resourceId);
      if (!student || student.teacherId !== user.id) {
        return res.status(403).json({ message: 'You do not have access to this student' });
      }
    } else if (resourceType === 'progress') {
      const progress = await storage.getProgressEntry(resourceId);
      if (!progress) {
        return res.status(404).json({ message: 'Progress entry not found' });
      }
      
      const student = await storage.getStudent(progress.studentId);
      if (!student || student.teacherId !== user.id) {
        return res.status(403).json({ message: 'You do not have access to this progress entry' });
      }
    } else if (resourceType === 'plan') {
      const plan = await storage.getTeachingPlan(resourceId);
      if (!plan || plan.createdBy !== user.id) {
        return res.status(403).json({ message: 'You do not have access to this teaching plan' });
      }
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error during access check' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Error handler middleware
  app.use(handleErrors);

  // AUTH ROUTES
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      const isPasswordValid = await storage.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/auth/me', authenticate, async (req, res) => {
    return res.json({ user: (req as any).user });
  });

  // USER MANAGEMENT ROUTES (ADMIN ONLY)
  app.get('/api/users/teachers', authenticate, adminOnly, async (req, res) => {
    try {
      const teachers = await storage.getAllTeachers();
      
      // Enhance teacher data with their assigned classes
      const enhancedTeachers = await Promise.all(teachers.map(async (teacher) => {
        const classes = await storage.getTeacherClasses(teacher.id);
        const students = await storage.getStudentsByTeacher(teacher.id);
        return {
          ...teacher,
          password: undefined, // Don't send password
          classes: classes.map(c => c.class),
          studentCount: students.length
        };
      }));
      
      return res.json(enhancedTeachers);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching teachers' });
    }
  });

  app.post('/api/users/teachers', authenticate, adminOnly, async (req, res) => {
    try {
      const userData = insertUserSchema.parse({
        ...req.body,
        role: 'teacher'
      });
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      const user = await storage.createUser(userData);
      
      // Assign classes if provided
      if (req.body.classes && Array.isArray(req.body.classes)) {
        await Promise.all(req.body.classes.map(async (className: string) => {
          await storage.assignClassToTeacher({
            teacherId: user.id,
            class: className
          });
        }));
      }
      
      return res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      return res.status(500).json({ message: 'Error creating teacher' });
    }
  });

  app.put('/api/users/teachers/:id', authenticate, adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const user = await storage.getUser(id);
      if (!user || user.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      
      // Update user data
      const updatedUser = await storage.updateUser(id, req.body);
      
      // Update class assignments if provided
      if (req.body.classes && Array.isArray(req.body.classes)) {
        // Remove existing class assignments
        const existingClasses = await storage.getTeacherClasses(id);
        await Promise.all(existingClasses.map(async (c) => {
          await storage.removeClassFromTeacher(c.id);
        }));
        
        // Add new class assignments
        await Promise.all(req.body.classes.map(async (className: string) => {
          await storage.assignClassToTeacher({
            teacherId: id,
            class: className
          });
        }));
      }
      
      return res.json({
        id: updatedUser!.id,
        email: updatedUser!.email,
        name: updatedUser!.name,
        role: updatedUser!.role
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating teacher' });
    }
  });

  app.delete('/api/users/teachers/:id', authenticate, adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const user = await storage.getUser(id);
      if (!user || user.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      
      // Delete the teacher
      await storage.deleteUser(id);
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting teacher' });
    }
  });

  // TEACHER CLASS ASSIGNMENT ROUTES
  app.get('/api/teacher-classes/:teacherId', authenticate, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      if (isNaN(teacherId)) {
        return res.status(400).json({ message: 'Invalid teacher ID' });
      }
      
      // Check access rights (admin or the teacher themselves)
      if ((req as any).user.role !== 'admin' && (req as any).user.id !== teacherId) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      
      const classes = await storage.getTeacherClasses(teacherId);
      return res.json(classes);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching teacher classes' });
    }
  });

  app.post('/api/teacher-classes', authenticate, adminOnly, async (req, res) => {
    try {
      const teacherClass = insertTeacherClassSchema.parse(req.body);
      const result = await storage.assignClassToTeacher(teacherClass);
      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      return res.status(500).json({ message: 'Error assigning class to teacher' });
    }
  });

  app.delete('/api/teacher-classes/:id', authenticate, adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      await storage.removeClassFromTeacher(id);
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: 'Error removing class from teacher' });
    }
  });

  // STUDENT MANAGEMENT ROUTES
  app.get('/api/students', authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      let students;
      
      // Filter by class if provided
      const classFilter = req.query.class as string;
      
      if (user.role === 'admin') {
        if (classFilter) {
          students = await storage.getStudentsByClass(classFilter);
        } else {
          students = await storage.getAllStudents();
        }
      } else {
        // For teachers, only show their assigned students
        students = await storage.getStudentsByTeacher(user.id);
        if (classFilter) {
          students = students.filter(s => s.class === classFilter);
        }
      }
      
      return res.json(students);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching students' });
    }
  });

  app.get('/api/students/:id', authenticate, teacherAccessCheck, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const student = await storage.getStudent(id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      return res.json(student);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching student' });
    }
  });

  app.post('/api/students', authenticate, async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      
      // If teacher is creating a student, automatically assign to themselves
      if ((req as any).user.role === 'teacher' && !studentData.teacherId) {
        studentData.teacherId = (req as any).user.id;
      }
      
      const student = await storage.createStudent(studentData);
      return res.status(201).json(student);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      return res.status(500).json({ message: 'Error creating student' });
    }
  });

  app.put('/api/students/:id', authenticate, teacherAccessCheck, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedStudent = await storage.updateStudent(id, req.body);
      if (!updatedStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      return res.json(updatedStudent);
    } catch (error) {
      return res.status(500).json({ message: 'Error updating student' });
    }
  });

  app.delete('/api/students/:id', authenticate, teacherAccessCheck, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      await storage.deleteStudent(id);
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting student' });
    }
  });

  // ASSIGN STUDENTS TO TEACHERS (ADMIN ONLY)
  app.post('/api/assign-student', authenticate, adminOnly, async (req, res) => {
    try {
      const { studentId, teacherId } = req.body;
      if (!studentId || !teacherId) {
        return res.status(400).json({ message: 'Student ID and Teacher ID are required' });
      }
      
      const student = await storage.assignStudentToTeacher(studentId, teacherId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      return res.json(student);
    } catch (error) {
      return res.status(500).json({ message: 'Error assigning student to teacher' });
    }
  });

  // PROGRESS TRACKING ROUTES
  app.get('/api/progress', authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      
      if (studentId) {
        // Check if teacher has access to this student
        if (user.role === 'teacher') {
          const student = await storage.getStudent(studentId);
          if (!student || student.teacherId !== user.id) {
            return res.status(403).json({ message: 'You do not have access to this student' });
          }
        }
        
        const entries = await storage.getProgressEntriesByStudent(studentId);
        return res.json(entries);
      } else {
        // For now, return an empty array
        // In a real app, we would need to filter based on teacher's students
        return res.json([]);
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching progress entries' });
    }
  });

  app.get('/api/progress/:id', authenticate, teacherAccessCheck, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const entry = await storage.getProgressEntry(id);
      if (!entry) {
        return res.status(404).json({ message: 'Progress entry not found' });
      }
      
      return res.json(entry);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching progress entry' });
    }
  });

  app.post('/api/progress', authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const entryData = insertProgressEntrySchema.parse({
        ...req.body,
        createdBy: user.id
      });
      
      // Check if teacher has access to this student
      if (user.role === 'teacher') {
        const student = await storage.getStudent(entryData.studentId);
        if (!student || student.teacherId !== user.id) {
          return res.status(403).json({ message: 'You do not have access to this student' });
        }
      }
      
      const entry = await storage.createProgressEntry(entryData);
      return res.status(201).json(entry);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      return res.status(500).json({ message: 'Error creating progress entry' });
    }
  });

  app.put('/api/progress/:id', authenticate, teacherAccessCheck, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedEntry = await storage.updateProgressEntry(id, req.body);
      if (!updatedEntry) {
        return res.status(404).json({ message: 'Progress entry not found' });
      }
      
      return res.json(updatedEntry);
    } catch (error) {
      return res.status(500).json({ message: 'Error updating progress entry' });
    }
  });

  app.delete('/api/progress/:id', authenticate, teacherAccessCheck, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      await storage.deleteProgressEntry(id);
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting progress entry' });
    }
  });

  // TEACHING PLANS ROUTES
  app.get('/api/plans', authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const classFilter = req.query.class as string;
      const typeFilter = req.query.type as string;
      let plans;
      
      if (user.role === 'admin') {
        plans = await storage.getAllTeachingPlans();
      } else {
        // For teachers, only show their plans
        plans = await storage.getTeachingPlansByTeacher(user.id);
      }
      
      // Apply filters
      if (classFilter) {
        plans = plans.filter(p => p.class === classFilter);
      }
      
      if (typeFilter) {
        plans = plans.filter(p => p.type === typeFilter);
      }
      
      return res.json(plans);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching teaching plans' });
    }
  });

  app.get('/api/plans/:id', authenticate, teacherAccessCheck, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const plan = await storage.getTeachingPlan(id);
      if (!plan) {
        return res.status(404).json({ message: 'Teaching plan not found' });
      }
      
      return res.json(plan);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching teaching plan' });
    }
  });

  app.post('/api/plans', authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const planData = insertTeachingPlanSchema.parse({
        ...req.body,
        createdBy: user.id
      });
      
      const plan = await storage.createTeachingPlan(planData);
      return res.status(201).json(plan);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      return res.status(500).json({ message: 'Error creating teaching plan' });
    }
  });

  app.put('/api/plans/:id', authenticate, teacherAccessCheck, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedPlan = await storage.updateTeachingPlan(id, req.body);
      if (!updatedPlan) {
        return res.status(404).json({ message: 'Teaching plan not found' });
      }
      
      return res.json(updatedPlan);
    } catch (error) {
      return res.status(500).json({ message: 'Error updating teaching plan' });
    }
  });

  app.delete('/api/plans/:id', authenticate, teacherAccessCheck, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      await storage.deleteTeachingPlan(id);
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting teaching plan' });
    }
  });

  // DEEPSEEK AI INTEGRATION
  app.post('/api/ai/suggestions', authenticate, async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ message: 'AI service is not configured' });
      }
      
      try {
        const response = await axios.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 500
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          }
        );
        
        return res.json({
          suggestions: response.data.choices[0].message.content
        });
      } catch (apiError) {
        console.error('AI API error:', apiError);
        
        // Fallback to static response
        return res.json({
          suggestions: `Here are some suggested activities for ${prompt.includes('Nursery') ? 'Nursery' : prompt.includes('LKG') ? 'LKG' : 'UKG'} students:\n\n1. Color Sorting: Use colored blocks for sorting activities.\n2. Story Time: Read interactive stories with simple words and colorful pictures.\n3. Number Fun: Count objects up to 10 with physical items.\n4. Shapes Exploration: Identify basic shapes in classroom objects.`
        });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error generating AI suggestions' });
    }
  });

  // CLOUDINARY PHOTO UPLOAD
  app.post('/api/upload/photo', authenticate, upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      if (!cloudinary.config().api_key) {
        return res.status(503).json({ message: 'Cloudinary is not configured' });
      }
      
      const filePath = req.file.path;
      
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'students',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png'],
          max_file_size: 1 * 1024 * 1024 // 1MB limit
        });
        
        // Clean up the temporary file
        fs.unlinkSync(filePath);
        
        return res.json({
          url: result.secure_url,
          publicId: result.public_id
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        
        // Clean up the temporary file
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Error deleting temporary file:', e);
        }
        
        return res.status(500).json({ message: 'Error uploading to Cloudinary' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error processing file upload' });
    }
  });

  return httpServer;
}
