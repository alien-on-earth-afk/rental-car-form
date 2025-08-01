import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRegistrationSchema } from "@shared/schema";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const adminPasswordSchema = z.object({
  password: z.string(),
});

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Hashed admin password (default password: admin@123@#)
// In production, this should be set via environment variable
const DEFAULT_ADMIN_PASSWORD_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeO4LKE.ttHZ7cz3u'; // admin@123@#

async function getAdminPasswordHash(): Promise<string> {
  const envPassword = process.env.ADMIN_PASSWORD;
  if (envPassword) {
    // If environment password is provided, hash it
    return await bcrypt.hash(envPassword, 12);
  }
  return DEFAULT_ADMIN_PASSWORD_HASH;
}

// Utility function to generate password hash (for development/testing)
export async function generatePasswordHash(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

// In-memory store for session tokens (in production, use Redis or database)
const sessionTokens = new Map<string, { ownerName: string, timestamp: number, used: boolean }>();

// Clean up expired tokens every 15 minutes
setInterval(() => {
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;

  sessionTokens.forEach((data, token) => {
    if (now - data.timestamp > fifteenMinutes || data.used) {
      sessionTokens.delete(token);
    }
  });
}, 15 * 60 * 1000);

// Rate limiting middleware
const createRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 registration requests per windowMs
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 admin requests per windowMs
  message: {
    success: false,
    message: "Too many admin requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: "Too many login attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Registration form submission with rate limiting
  app.post("/api/registrations", createRegistrationLimiter, async (req, res) => {
    try {
      const validatedData = insertRegistrationSchema.parse(req.body);
      const registration = await storage.createRegistration(validatedData);

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      sessionTokens.set(sessionToken, { 
        ownerName: validatedData.ownerName, 
        timestamp: Date.now(), 
        used: false 
      });

      res.json({ success: true, data: registration, sessionToken });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  });

  // Session token validation for results page access
  app.post("/api/validate-session", createRegistrationLimiter, async (req, res) => {
    try {
      const { token } = req.body;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ 
          valid: false, 
          message: "Token is required" 
        });
      }

      const sessionData = sessionTokens.get(token);

      if (!sessionData) {
        return res.status(401).json({ 
          valid: false, 
          message: "Invalid or expired token" 
        });
      }

      // Check if token has expired (10 minutes)
      const tenMinutes = 10 * 60 * 1000;
      if (Date.now() - sessionData.timestamp > tenMinutes) {
        sessionTokens.delete(token);
        return res.status(401).json({ 
          valid: false, 
          message: "Token has expired" 
        });
      }

      // Check if token has already been used
      if (sessionData.used) {
        sessionTokens.delete(token);
        return res.status(401).json({ 
          valid: false, 
          message: "Token already used" 
        });
      }

      // Mark token as used (one-time use)
      sessionData.used = true;

      res.json({ 
        valid: true, 
        ownerName: sessionData.ownerName 
      });

    } catch (error) {
      res.status(500).json({ 
        valid: false, 
        message: "Internal server error" 
      });
    }
  });

  // Admin login with enhanced security
  app.post("/api/admin/login", loginLimiter, async (req, res) => {
    try {
      const { password } = adminPasswordSchema.parse(req.body);
      
      // Get the hashed admin password
      const adminPasswordHash = await getAdminPasswordHash();
      
      // Compare the provided password with the hashed password
      const isValidPassword = await bcrypt.compare(password, adminPasswordHash);
      
      if (isValidPassword) {
        // Generate JWT token
        const token = jwt.sign(
          { role: 'admin', timestamp: Date.now() },
          JWT_SECRET,
          { expiresIn: '2h' } // Token expires in 2 hours
        );
        
        res.json({ 
          success: true, 
          message: "Login successful",
          token,
          expiresIn: 7200 // 2 hours in seconds
        });
      } else {
        res.status(401).json({ success: false, message: "Invalid password" });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Get registrations with pagination and filtering (admin only)
  app.get("/api/registrations", adminLimiter, authenticateToken, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const filter = req.query.filter as string || 'all';
      
      const allRegistrations = await storage.getAllRegistrations();
      
      // Apply search and filtering
      let filteredRegistrations = allRegistrations.filter(registration => {
        const matchesSearch = search === '' || 
          registration.ownerName.toLowerCase().includes(search.toLowerCase()) ||
          registration.carModel.toLowerCase().includes(search.toLowerCase()) ||
          registration.regNumber.toLowerCase().includes(search.toLowerCase()) ||
          registration.driverName.toLowerCase().includes(search.toLowerCase()) ||
          registration.ownerContact.includes(search) ||
          registration.driverContact.includes(search);

        const matchesFilter = 
          filter === 'all' ||
          (filter === 'cng' && registration.cngPowered) ||
          (filter === 'regular' && !registration.cngPowered);

        return matchesSearch && matchesFilter;
      });

      // Sort by date (newest first)
      filteredRegistrations.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex);

      res.json({ 
        success: true, 
        data: paginatedRegistrations,
        meta: {
          total: filteredRegistrations.length,
          page,
          limit,
          totalPages: Math.ceil(filteredRegistrations.length / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Get analytics summary (lightweight)
  app.get("/api/analytics", adminLimiter, authenticateToken, async (req, res) => {
    try {
      const registrations = await storage.getAllRegistrations();
      
      const totalRegistrations = registrations.length;
      const cngPowered = registrations.filter(r => r.cngPowered).length;
      const uniqueCars = new Set(registrations.map(r => r.carModel.toLowerCase())).size;
      
      // Only last 7 days for performance
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const registrationsByDate = last7Days.map(date => {
        const count = registrations.filter(r => 
          new Date(r.createdAt).toISOString().split('T')[0] === date
        ).length;
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count
        };
      });

      // Top 5 car models only
      const carModels = registrations.reduce((acc, r) => {
        const model = r.carModel.toLowerCase();
        acc[model] = (acc[model] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const carModelChart = Object.entries(carModels)
        .map(([model, count]) => ({ model: model.charAt(0).toUpperCase() + model.slice(1), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          totalRegistrations,
          cngPowered,
          regularPowered: totalRegistrations - cngPowered,
          uniqueCars,
          registrationsByDate,
          carModelChart,
          thisWeekCount: registrationsByDate.reduce((sum, day) => sum + day.count, 0)
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Download CSV file (admin only)
  app.get("/api/download-csv", adminLimiter, authenticateToken, async (req, res) => {
    try {
      const csvData = await storage.exportToCsv();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
      
      res.send(csvData);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error generating CSV file" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
