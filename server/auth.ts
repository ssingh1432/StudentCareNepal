import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { User } from "@shared/schema";

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || "nepal_central_high_school_secret";

// Generate JWT token
export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    classes: user.classes
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

// Verify password
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// JWT verification middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Get token from headers or cookies
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    
    req.user = decoded as User;
    next();
  });
}

// Admin role middleware
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}

// Teacher role middleware
export function isTeacher(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role !== "teacher") {
    return res.status(403).json({ message: "Teacher access required" });
  }
  
  next();
}

// Check teacher class assignment
export function canAccessClass(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Admins can access all classes
  if (req.user.role === "admin") {
    return next();
  }
  
  const requestedClass = req.params.class || req.body.class;
  
  if (!requestedClass) {
    return next();
  }
  
  if (!req.user.classes || !req.user.classes.includes(requestedClass)) {
    return res.status(403).json({ 
      message: `You don't have access to the ${requestedClass} class` 
    });
  }
  
  next();
}

// Check student access permission for teachers
export async function canAccessStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Admins can access all students
  if (req.user.role === "admin") {
    return next();
  }
  
  const studentId = parseInt(req.params.id || req.body.studentId);
  
  if (!studentId) {
    return next();
  }
  
  const student = await storage.getStudent(studentId);
  
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  
  if (student.teacherId !== req.user.id) {
    return res.status(403).json({ 
      message: "You don't have access to this student" 
    });
  }
  
  next();
}
