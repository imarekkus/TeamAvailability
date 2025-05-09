import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertAvailabilitySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Function to schedule the monthly cleanup
function scheduleMonthlyCleanup() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const timeUntilNextMonth = nextMonth.getTime() - now.getTime();
  
  console.log(`Scheduling cleanup for ${nextMonth.toISOString()}`);
  
  // Schedule the cleanup for the first day of the next month
  setTimeout(async () => {
    try {
      console.log("Running monthly cleanup of past availability data");
      await storage.cleanupPastMonthData();
      
      // Schedule the next cleanup
      scheduleMonthlyCleanup();
    } catch (error) {
      console.error("Error during scheduled cleanup:", error);
      // Still reschedule even if there was an error
      scheduleMonthlyCleanup();
    }
  }, timeUntilNextMonth);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const parseResult = insertUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: fromZodError(parseResult.error).message 
        });
      }

      const user = await storage.createUser(parseResult.data);
      return res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      const users = await storage.getUsersWithAvailabilityCounts();
      return res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      await storage.deleteUser(userId);
      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Availability routes
  app.post("/api/availability", async (req: Request, res: Response) => {
    try {
      const parseResult = insertAvailabilitySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: fromZodError(parseResult.error).message 
        });
      }

      const availability = await storage.setAvailability(parseResult.data);
      return res.status(201).json(availability);
    } catch (error) {
      console.error("Error setting availability:", error);
      return res.status(500).json({ message: "Failed to set availability" });
    }
  });

  app.post("/api/availability/toggle", async (req: Request, res: Response) => {
    try {
      const { userId, date } = req.body;
      
      if (!userId || !date) {
        return res.status(400).json({ message: "userId and date are required" });
      }

      const availability = await storage.toggleAvailability(userId, date);
      return res.json(availability);
    } catch (error) {
      console.error("Error toggling availability:", error);
      return res.status(500).json({ message: "Failed to toggle availability" });
    }
  });

  app.get("/api/availability/dates", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        return res.status(400).json({ message: "startDate and endDate are required query parameters" });
      }

      const dateAvailability = await storage.getDateAvailabilities(startDate, endDate);
      return res.json(dateAvailability);
    } catch (error) {
      console.error("Error fetching date availability:", error);
      return res.status(500).json({ message: "Failed to fetch date availability" });
    }
  });

  // Setup monthly cleanup process and run an initial cleanup
  try {
    // Run an initial cleanup when the server starts
    storage.cleanupPastMonthData().then(() => {
      console.log("Initial past data cleanup completed");
      
      // Schedule recurring monthly cleanups
      scheduleMonthlyCleanup();
    }).catch(err => {
      console.error("Error during initial data cleanup:", err);
      // Still schedule the recurring cleanup even if initial cleanup fails
      scheduleMonthlyCleanup();
    });
  } catch (error) {
    console.error("Error setting up data cleanup:", error);
  }
  
  const httpServer = createServer(app);
  return httpServer;
}
