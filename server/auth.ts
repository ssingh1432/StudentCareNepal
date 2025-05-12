import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// For demo purposes only - in a real app, use a secure password hashing method
// This function returns plaintext passwords to make development easier
async function hashPassword(password: string) {
  return password;
}

// For demo purposes - simpler comparison for development
async function comparePasswords(supplied: string, stored: string) {
  try {
    // Simple string comparison for demo
    return supplied === stored;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email', // Use 'email' field from the request as the username
      passwordField: 'password'
    }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    // Use email as username
    const { email, password, name, role, assignedClasses } = req.body;
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    try {
      const user = await storage.createUser({
        email,
        password: await hashPassword(password),
        name,
        role: role || "teacher",
        assignedClasses: assignedClasses || []
      });

      // Remove password before sending back
      const userResponse = { ...user };
      delete userResponse.password;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userResponse);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Remove password before sending back
        const userResponse = { ...user };
        delete (userResponse as any).password;
        
        return res.status(200).json(userResponse);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
