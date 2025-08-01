import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRegistrationSchema, insertRideRequestSchema, type InsertRegistration, type InsertRideRequest } from "@shared/schema";
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

// Secure hashed admin password
const DEFAULT_ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfaGqwtRKQHZpzO'; // admin@123@#

async function getAdminPasswordHash(): Promise<string> {
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

// Rate limiting middleware - configured for Replit environment
const createRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased limit for development
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true, // Enable trust proxy for Replit
  skip: () => process.env.NODE_ENV === 'development' // Skip in development
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased limit for development
  message: {
    success: false,
    message: "Too many admin requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  skip: () => process.env.NODE_ENV === 'development'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased limit for development
  message: {
    success: false,
    message: "Too many login attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  skip: () => process.env.NODE_ENV === 'development'
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
  // Submit car rental registration
  app.post("/api/registrations", createRegistrationLimiter, async (req: Request, res: Response) => {
    try {
      const result = insertRegistrationSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid form data",
          errors: result.error.errors
        });
      }

      const registration = await storage.createRegistration(result.data);

      // Generate session token for results page access
      const sessionToken = crypto.randomBytes(32).toString('hex');
      sessionTokens.set(sessionToken, {
        ownerName: result.data.ownerName,
        timestamp: Date.now(),
        used: false
      });

      res.json({
        success: true,
        message: "Registration submitted successfully!",
        sessionToken,
        registration: registration
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit registration"
      });
    }
  });

  // Submit ride request
  app.post("/api/ride-requests", createRegistrationLimiter, async (req: Request, res: Response) => {
    try {
      const result = insertRideRequestSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid form data",
          errors: result.error.errors
        });
      }

      const id = crypto.randomUUID();
      const sessionToken = crypto.randomUUID();

      const createdRideRequest = await storage.createRideRequest({
        id,
        ...result.data,
        createdAt: new Date().toISOString(),
      });

      // Store session token for ride requests
      sessionTokens.set(sessionToken, { 
        ownerName: result.data.passengerName, 
        timestamp: Date.now(), 
        used: false 
      });

      res.json({
        success: true,
        message: "Ride request submitted successfully!",
        sessionToken,
        data: createdRideRequest
      });
    } catch (error) {
      console.error("Ride request error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit ride request"
      });
    }
  });

  app.post("/api/validate-session", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ valid: false, error: "Invalid token" });
      }

      // Here you would typically validate the token against your database
      // For now, we'll just check if it's a valid format (simple validation)
      const isValid = token.length > 10; // Basic validation

      res.json({ valid: isValid });
    } catch (error) {
      console.error("Session validation error:", error);
      res.status(500).json({ valid: false, error: "Server error" });
    }
  });

  app.post("/api/validate-ride-session", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ valid: false, error: "Invalid token" });
      }

      // Here you would typically validate the token against your database
      // For now, we'll just check if it's a valid format (simple validation)
      const isValid = token.length > 10; // Basic validation

      res.json({ valid: isValid });
    } catch (error) {
      console.error("Ride session validation error:", error);
      res.status(500).json({ valid: false, error: "Server error" });
    }
  });

  // Admin login
  app.post("/api/admin/login", loginLimiter, async (req: Request, res: Response) => {
    try {
      const { password } = adminPasswordSchema.parse(req.body);

      // Compare with hashed password using bcrypt
      const passwordHash = await getAdminPasswordHash();
      const isValidPassword = await bcrypt.compare(password, passwordHash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid password"
        });
      }

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
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Middleware to authenticate admin role
  const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Admin access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized admin access' });
      }
      req.user = user;
      next();
    });
  };

  // Get all registrations (admin only)
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
      const type = req.query.type as string || 'registrations';
      
      let csvData: string;
      let filename: string;
      
      if (type === 'ride-requests') {
        csvData = await storage.exportRideRequestsToCsv();
        filename = 'ride-requests.csv';
      } else {
        csvData = await storage.exportToCsv();
        filename = 'registrations.csv';
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

      res.send(csvData);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error generating CSV file" 
      });
    }
  });

  // Admin-only routes
  // Get all registrations (admin only)
  app.get("/api/admin/registrations", adminLimiter, authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const registrations = await storage.getAllRegistrations();
      res.json({
        success: true,
        registrations
      });
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch registrations"
      });
    }
  });

  // Get paginated ride requests (admin only)
  app.get("/api/ride-requests", adminLimiter, authenticateToken, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const filter = req.query.filter as string || 'all';

      const allRideRequests = await storage.getAllRideRequests();

      // Apply search and filtering
      let filteredRideRequests = allRideRequests.filter(rideRequest => {
        const matchesSearch = search === '' || 
          rideRequest.passengerName.toLowerCase().includes(search.toLowerCase()) ||
          rideRequest.pickupLocation.toLowerCase().includes(search.toLowerCase()) ||
          rideRequest.dropoffLocation.toLowerCase().includes(search.toLowerCase()) ||
          rideRequest.passengerContact.includes(search);

        const matchesFilter = 
          filter === 'all' ||
          (filter === 'cng' && rideRequest.prefersCNG) ||
          (filter === 'regular' && !rideRequest.prefersCNG);

        return matchesSearch && matchesFilter;
      });

      // Sort by date (newest first)
      filteredRideRequests.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRideRequests = filteredRideRequests.slice(startIndex, endIndex);

      res.json({ 
        success: true, 
        data: paginatedRideRequests,
        total: filteredRideRequests.length,
        page,
        totalPages: Math.ceil(filteredRideRequests.length / limit)
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Ride analytics for admin panel
  app.get("/api/ride-analytics", adminLimiter, authenticateToken, async (req, res) => {
    try {
      const rideRequests = await storage.getAllRideRequests();

      const totalRideRequests = rideRequests.length;
      const cngPreferred = rideRequests.filter(r => r.prefersCNG).length;
      const avgPassengers = rideRequests.length > 0 
        ? (rideRequests.reduce((sum, r) => sum + r.passengers, 0) / rideRequests.length).toFixed(1)
        : 0;

      // Popular pickup locations
      const pickupCounts = rideRequests.reduce((acc, r) => {
        acc[r.pickupLocation] = (acc[r.pickupLocation] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const popularPickups = Object.entries(pickupCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          totalRideRequests,
          cngPreferred,
          avgPassengers,
          popularPickups
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Get all ride requests (admin only)
  app.get("/api/admin/ride-requests", adminLimiter, authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const rideRequests = await storage.getAllRideRequests();
      res.json({
        success: true,
        rideRequests
      });
    } catch (error) {
      console.error("Error fetching ride requests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch ride requests"
      });
    }
  });

  // Export registrations to CSV (admin only)
  app.get("/api/admin/export", adminLimiter, authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const registrations = await storage.exportToCsv();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');

      res.send(registrations);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error generating CSV file"
      });
    }
  });

  // Export ride requests to CSV (admin only)
  app.get("/api/admin/export-rides", adminLimiter, authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const rideRequests = await storage.exportRideRequestsToCsv();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ride-requests.csv');

      res.send(rideRequests);
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