import { users, type User, type InsertUser, availability, type Availability, type InsertAvailability, type UserWithAvailabilityCount, type DateAvailability } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private availability: Map<string, Availability>;
  private currentUserId: number;
  private currentAvailabilityId: number;

  constructor() {
    this.users = new Map();
    this.availability = new Map();
    this.currentUserId = 1;
    this.currentAvailabilityId = 1;
  }

  // User management
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const existingUser = await this.getUserByUsername(insertUser.username);
    if (existingUser) {
      return existingUser;
    }
    
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Availability management
  async getAvailabilityByUser(userId: number): Promise<Availability[]> {
    return Array.from(this.availability.values()).filter(
      (a) => a.userId === userId
    );
  }

  async getAvailabilityByDate(date: string): Promise<Availability[]> {
    return Array.from(this.availability.values()).filter(
      (a) => a.date.toISOString().split('T')[0] === date
    );
  }

  async setAvailability(data: InsertAvailability): Promise<Availability> {
    const key = `${data.userId}-${data.date.toISOString().split('T')[0]}`;
    const existing = Array.from(this.availability.values()).find(
      (a) => a.userId === data.userId && a.date.toISOString().split('T')[0] === data.date.toISOString().split('T')[0]
    );

    if (existing) {
      const updated = { ...existing, available: data.available };
      this.availability.set(key, updated);
      return updated;
    } else {
      const id = this.currentAvailabilityId++;
      const newAvailability: Availability = { 
        ...data, 
        id,
        date: data.date instanceof Date ? data.date : new Date(data.date)
      };
      this.availability.set(key, newAvailability);
      return newAvailability;
    }
  }

  async toggleAvailability(userId: number, dateStr: string): Promise<Availability> {
    const key = `${userId}-${dateStr}`;
    const date = new Date(dateStr);
    const existing = Array.from(this.availability.values()).find(
      (a) => a.userId === userId && a.date.toISOString().split('T')[0] === dateStr
    );

    if (existing) {
      const updated = { ...existing, available: !existing.available };
      this.availability.set(key, updated);
      return updated;
    } else {
      const id = this.currentAvailabilityId++;
      const newAvailability: Availability = { 
        id, 
        userId, 
        date, 
        available: true 
      };
      this.availability.set(key, newAvailability);
      return newAvailability;
    }
  }

  // Aggregated data
  async getUsersWithAvailabilityCounts(): Promise<UserWithAvailabilityCount[]> {
    const users = await this.getUsers();
    return Promise.all(users.map(async (user) => {
      const userAvailability = await this.getAvailabilityByUser(user.id);
      const availableCount = userAvailability.filter(a => a.available).length;
      return {
        ...user,
        availabilityCount: availableCount
      };
    }));
  }

  async getDateAvailabilities(startDate: string, endDate: string): Promise<DateAvailability[]> {
    const allUsers = await this.getUsers();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: DateAvailability[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dateAvailability = await this.getAvailabilityByDate(dateStr);
      
      const availableUsers = await Promise.all(
        dateAvailability
          .filter(a => a.available)
          .map(async a => this.getUser(a.userId))
      );
      
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

export const storage = new MemStorage();
