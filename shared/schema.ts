import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const registrations = sqliteTable("registrations", {
  id: text("id").primaryKey(),
  ownerName: text("owner_name").notNull(),
  ownerContact: text("owner_contact").notNull(),
  carModel: text("car_model").notNull(),
  regNumber: text("reg_number").notNull(),
  seats: integer("seats").notNull(),
  cngPowered: integer("cng_powered", { mode: 'boolean' }).notNull(),
  driverName: text("driver_name").notNull(),
  driverContact: text("driver_contact").notNull(),
  createdAt: text("created_at").notNull(),
});

export const rideRequests = sqliteTable("ride_requests", {
  id: text("id").primaryKey(),
  passengerName: text("passenger_name").notNull(),
  passengerContact: text("passenger_contact").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  dropoffLocation: text("dropoff_location").notNull(),
  rideDate: text("ride_date").notNull(),
  rideTime: text("ride_time").notNull(),
  passengers: integer("passengers").notNull(),
  prefersCNG: integer("prefers_cng", { mode: 'boolean' }).notNull(),
  specialRequests: text("special_requests"),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  createdAt: true,
});

export const insertRideRequestSchema = createInsertSchema(rideRequests).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type InsertRideRequest = z.infer<typeof insertRideRequestSchema>;

// For the database, we store createdAt as string, but for the API we use Date
export type RegistrationDB = typeof registrations.$inferSelect;
export type Registration = Omit<RegistrationDB, 'createdAt'> & { createdAt: Date };

export type RideRequestDB = typeof rideRequests.$inferSelect;
export type RideRequest = Omit<RideRequestDB, 'createdAt'> & { createdAt: Date };