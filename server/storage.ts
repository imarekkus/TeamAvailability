import { users, type User, type InsertUser, availability, type Availability, type InsertAvailability, type UserWithAvailabilityCount, type DateAvailability } from "@shared/schema";
import { eq, and, between, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User management
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Availability management
  getAvailabilityByUser(userId: number): Promise<Availability[]>;
  getAvailabilityByDate(date: string): Promise<Availability[]>;
  setAvailability(data: InsertAvailability): Promise<Availability>;
  toggleAvailability(userId: number, date: string): Promise<Availability>;
  
  // Aggregated data
  getUsersWithAvailabilityCounts(): Promise<UserWithAvailabilityCount[]>;
  getDateAvailabilities(startDate: string, endDate: string): Promise<DateAvailability[]>;
}

export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`);
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const existingUser = await this.getUserByUsername(insertUser.username);
    if (existingUser) {
      return existingUser;
    }
    
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    
    return user;
  }

  async getAvailabilityByUser(userId: number): Promise<Availability[]> {
    return await db
      .select()
      .from(availability)
      .where(eq(availability.userId, userId));
  }

  async getAvailabilityByDate(date: string): Promise<Availability[]> {
    return await db
      .select()
      .from(availability)
      .where(eq(sql`DATE(${availability.date})`, date));
  }

  async setAvailability(data: InsertAvailability): Promise<Availability> {
    // Convert date to string if it's not already
    const dateStr = typeof data.date === 'string'
      ? data.date
      : (data.date as Date).toISOString().split('T')[0];
    
    // Check if availability record exists
    const [existing] = await db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.userId, data.userId),
          eq(sql`DATE(${availability.date})`, dateStr)
        )
      );

    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(availability)
        .set({ available: data.available })
        .where(eq(availability.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Insert new record
      const [newAvailability] = await db
        .insert(availability)
        .values({
          userId: data.userId,
          date: dateStr,
          available: data.available ?? true
        })
        .returning();
      
      return newAvailability;
    }
  }

  async toggleAvailability(userId: number, dateStr: string): Promise<Availability> {
    // Check if availability record exists
    const [existing] = await db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.userId, userId),
          eq(sql`DATE(${availability.date})`, dateStr)
        )
      );

    if (existing) {
      // Toggle available flag
      const [updated] = await db
        .update(availability)
        .set({ available: !existing.available })
        .where(eq(availability.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Create new availability record with available=true
      const [newAvailability] = await db
        .insert(availability)
        .values({
          userId,
          date: dateStr,
          available: true
        })
        .returning();
      
      return newAvailability;
    }
  }

  async getUsersWithAvailabilityCounts(): Promise<UserWithAvailabilityCount[]> {
    // Get all users
    const usersList = await this.getUsers();
    
    // For each user, count their availability records
    return await Promise.all(
      usersList.map(async (user) => {
        const availabilities = await this.getAvailabilityByUser(user.id);
        const availabilityCount = availabilities.filter(a => a.available).length;
        
        return {
          ...user,
          availabilityCount
        };
      })
    );
  }

  async getDateAvailabilities(startDate: string, endDate: string): Promise<DateAvailability[]> {
    const allUsers = await this.getUsers();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: DateAvailability[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dateAvailability = await this.getAvailabilityByDate(dateStr);
      
      // Get users who are available on this date
      const availableUserIds = dateAvailability
        .filter(a => a.available)
        .map(a => a.userId);
      
      // Fetch user details for all available users
      const availableUsers = await Promise.all(
        availableUserIds.map(id => this.getUser(id))
      );
      
      // Filter out any undefined users
      const availableUsersFiltered = availableUsers.filter((user): user is User => user !== undefined);
      
      days.push({
        date: dateStr,
        availableUsers: availableUsersFiltered,
        allAvailable: availableUsersFiltered.length === allUsers.length && allUsers.length > 0
      });
    }

    return days;
  }
}

export const storage = new DatabaseStorage();
