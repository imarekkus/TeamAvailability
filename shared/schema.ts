import { pgTable, text, serial, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
});

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  available: boolean("available").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).pick({
  userId: true,
  date: true,
  available: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Availability = typeof availability.$inferSelect;

// For API responses
export interface UserWithAvailabilityCount extends User {
  availabilityCount: number;
}

export interface DateAvailability {
  date: string;
  availableUsers: User[];
  allAvailable: boolean;
}
