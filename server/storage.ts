import { type User, type InsertUser, type Registration, type InsertRegistration, type RegistrationDB, users, registrations, rideRequests, type InsertRideRequest, type RideRequestDB, type RideRequest } from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getAllRegistrations(): Promise<Registration[]>;
}

export class SqliteStorage implements IStorage {
  private db: Database.Database;
  private drizzle: ReturnType<typeof drizzle>;
  private dbPath: string;

  constructor() {
    try {
      // Ensure data directory exists
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`Created data directory: ${dataDir}`);
      }

      // Initialize SQLite database
      this.dbPath = path.join(dataDir, 'registrations.db');
      this.db = new Database(this.dbPath);
      this.drizzle = drizzle(this.db);

      // Enable WAL mode for better performance and concurrency
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('foreign_keys = ON');

      // Create tables if they don't exist
      this.initializeTables();
      console.log(`SQLite database initialized: ${this.dbPath}`);

      // Migrate existing CSV data if it exists
      this.migrateFromCsv();
    } catch (error) {
      console.error('Error initializing SQLite storage:', error);
      throw error;
    }
  }

  private initializeTables() {
    // Create users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);

    // Create registrations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        owner_name TEXT NOT NULL,
        owner_contact TEXT NOT NULL,
        car_model TEXT NOT NULL,
        reg_number TEXT NOT NULL,
        seats INTEGER NOT NULL,
        cng_powered INTEGER NOT NULL,
        driver_name TEXT NOT NULL,
        driver_contact TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ride_requests (
        id TEXT PRIMARY KEY,
        passenger_name TEXT NOT NULL,
        passenger_contact TEXT NOT NULL,
        pickup_location TEXT NOT NULL,
        dropoff_location TEXT NOT NULL,
        ride_date TEXT NOT NULL,
        ride_time TEXT NOT NULL,
        passengers INTEGER NOT NULL,
        prefers_cng INTEGER NOT NULL,
        special_requests TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
      CREATE INDEX IF NOT EXISTS idx_registrations_owner_name ON registrations(owner_name);
      CREATE INDEX IF NOT EXISTS idx_registrations_car_model ON registrations(car_model);
      CREATE INDEX IF NOT EXISTS idx_registrations_reg_number ON registrations(reg_number);
      CREATE INDEX IF NOT EXISTS idx_registrations_cng_powered ON registrations(cng_powered);
      CREATE INDEX IF NOT EXISTS idx_ride_requests_created_at ON ride_requests(created_at);
      CREATE INDEX IF NOT EXISTS idx_ride_requests_passenger_name ON ride_requests(passenger_name);
      CREATE INDEX IF NOT EXISTS idx_ride_requests_pickup_location ON ride_requests(pickup_location);
      CREATE INDEX IF NOT EXISTS idx_ride_requests_prefers_cng ON ride_requests(prefers_cng);
    `);
  }

  private migrateFromCsv() {
    try {
      const csvFilePath = path.join(process.cwd(), 'data', 'registrations.csv');

      if (!fs.existsSync(csvFilePath)) {
        console.log('No existing CSV file to migrate');
        return;
      }

      // Check if we already have data in SQLite
      const existingCount = this.drizzle.select().from(registrations).all().length;
      if (existingCount > 0) {
        console.log(`SQLite already has ${existingCount} registrations, skipping CSV migration`);
        return;
      }

      console.log('Migrating data from CSV to SQLite...');
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
      const lines = csvContent.trim().split('\n');

      // Skip header row
      if (lines.length <= 1) {
        console.log('CSV file has no data rows to migrate');
        return;
      }

      let migratedCount = 0;
      const transaction = this.db.transaction(() => {
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;

          try {
            // Parse CSV row (handling quoted fields)
            const fields = this.parseCsvLine(line);

            if (fields.length >= 10) {
              const registration = {
                id: fields[0],
                ownerName: fields[1].replace(/^"|"$/g, ''), // Remove quotes
                ownerContact: fields[2],
                carModel: fields[3].replace(/^"|"$/g, ''), // Remove quotes
                regNumber: fields[4],
                seats: parseInt(fields[5]),
                cngPowered: fields[6] === 'Yes',
                driverName: fields[7].replace(/^"|"$/g, ''), // Remove quotes
                driverContact: fields[8],
                createdAt: fields[9]
              };

              this.drizzle.insert(registrations).values(registration).run();
              migratedCount++;
            }
          } catch (rowError) {
            console.error(`Error migrating CSV row ${i}:`, rowError);
          }
        }
      });

      transaction();
      console.log(`Successfully migrated ${migratedCount} registrations from CSV to SQLite`);

      // Backup the CSV file
      const backupPath = csvFilePath + '.backup';
      fs.copyFileSync(csvFilePath, backupPath);
      console.log(`CSV file backed up to: ${backupPath}`);

    } catch (error) {
      console.error('Error migrating from CSV:', error);
    }
  }

  private parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last field
    fields.push(current.trim());

    return fields;
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = this.drizzle.select().from(users).where(eq(users.id, id)).get();
      return result || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = this.drizzle.select().from(users).where(eq(users.username, username)).get();
      return result || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };

    try {
      this.drizzle.insert(users).values(user).run();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    const dbRegistration: RegistrationDB = {
      ...insertRegistration,
      id,
      createdAt,
    };

    try {
      this.drizzle.insert(registrations).values(dbRegistration).run();
      console.log(`Registration saved to SQLite: ${id}`);

      // Return with Date object for API compatibility
      return {
        ...dbRegistration,
        createdAt: new Date(createdAt)
      };
    } catch (error) {
      console.error('Error creating registration:', error);
      throw error;
    }
  }

  async getAllRegistrations(): Promise<Registration[]> {
    try {
      const results = this.drizzle
        .select()
        .from(registrations)
        .orderBy(desc(registrations.createdAt))
        .all();

      // Convert the results to match the expected Registration type with Date objects
      return results.map(reg => ({
        id: reg.id,
        ownerName: reg.ownerName,
        ownerContact: reg.ownerContact,
        carModel: reg.carModel,
        regNumber: reg.regNumber,
        seats: reg.seats,
        cngPowered: reg.cngPowered,
        driverName: reg.driverName,
        driverContact: reg.driverContact,
        createdAt: new Date(reg.createdAt)
      }));
    } catch (error) {
      console.error('Error getting all registrations:', error);
      return [];
    }
  }

  async createRideRequest(insertRideRequest: InsertRideRequest & { id: string; createdAt: string }): Promise<RideRequest> {
    try {
      const dbRideRequest: RideRequestDB = {
        ...insertRideRequest,
      };

      this.drizzle.insert(rideRequests).values(dbRideRequest).run();
      console.log(`Ride request saved to SQLite: ${insertRideRequest.id}`);

      // Return with Date object for API compatibility
      return {
        ...dbRideRequest,
        createdAt: new Date(insertRideRequest.createdAt)
      };
    } catch (error) {
      console.error('Error creating ride request:', error);
      throw error;
    }
  }

  async getAllRideRequests(): Promise<RideRequest[]> {
    try {
      const results = this.drizzle
        .select()
        .from(rideRequests)
        .orderBy(desc(rideRequests.createdAt))
        .all();

      return results.map(req => ({
        id: req.id,
        passengerName: req.passengerName,
        passengerContact: req.passengerContact,
        pickupLocation: req.pickupLocation,
        dropoffLocation: req.dropoffLocation,
        rideDate: req.rideDate,
        rideTime: req.rideTime,
        passengers: req.passengers,
        prefersCNG: req.prefersCNG,
        specialRequests: req.specialRequests,
        createdAt: new Date(req.createdAt)
      }));
    } catch (error) {
      console.error('Error getting all ride requests:', error);
      return [];
    }
  }

  // Method to export data as CSV for download functionality
  async exportToCsv(): Promise<string> {
    try {
      const allRegistrations = await this.getAllRegistrations();

      const headers = [
        'ID',
        'Owner Name',
        'Owner Contact',
        'Car Model',
        'Registration Number',
        'Number of Seats',
        'CNG Powered',
        'Driver Name',
        'Driver Contact',
        'Created At'
      ];

      const csvRows = [
        headers.join(','),
        ...allRegistrations.map(reg => [
          reg.id,
          `"${reg.ownerName}"`,
          reg.ownerContact,
          `"${reg.carModel}"`,
          reg.regNumber,
          reg.seats,
          reg.cngPowered ? 'Yes' : 'No',
          `"${reg.driverName}"`,
          reg.driverContact,
          reg.createdAt.toISOString()
        ].join(','))
      ];

      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  async exportRideRequestsToCsv(): Promise<string> {
    try {
      const allRideRequests = await this.getAllRideRequests();

      const headers = [
        'ID',
        'Passenger Name',
        'Passenger Contact',
        'Pickup Location',
        'Dropoff Location',
        'Ride Date',
        'Ride Time',
        'Passengers',
        'Prefers CNG',
        'Special Requests',
        'Created At'
      ];

      const csvRows = [
        headers.join(','),
        ...allRideRequests.map(req => [
          req.id,
          `"${req.passengerName}"`,
          req.passengerContact,
          `"${req.pickupLocation}"`,
          `"${req.dropoffLocation}"`,
          req.rideDate,
          req.rideTime,
          req.passengers,
          req.prefersCNG ? 'Yes' : 'No',
          req.specialRequests ? `"${req.specialRequests}"` : '""',
          req.createdAt.toISOString()
        ].join(','))
      ];

      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting ride requests to CSV:', error);
      throw error;
    }
  }

  // Cleanup method for graceful shutdown
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export const storage = new SqliteStorage();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing SQLite database connection...');
  storage.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Closing SQLite database connection...');
  storage.close();
  process.exit(0);
});

export const db = {
  async insertRegistration(registration: InsertRegistration & { id: string; createdAt: string }) {
    return await drizzle(new Database(storage.dbPath)).insert(registrations).values(registration);
  },

  async getRegistrations(): Promise<Registration[]> {
    const drizzle_db = drizzle(new Database(storage.dbPath));
    const rows = await drizzle_db.select().from(registrations).orderBy(desc(registrations.createdAt)).all();
    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt)
    }));
  },

  async deleteRegistration(id: string) {
    const drizzle_db = drizzle(new Database(storage.dbPath));
    return await drizzle_db.delete(registrations).where(eq(registrations.id, id)).run();
  },

  async insertRideRequest(rideRequest: InsertRideRequest & { id: string; createdAt: string }) {
    const drizzle_db = drizzle(new Database(storage.dbPath));
    return await drizzle_db.insert(rideRequests).values(rideRequest).run();
  },

  async getRideRequests(): Promise<RideRequest[]> {
    const drizzle_db = drizzle(new Database(storage.dbPath));
    const rows = await drizzle_db.select().from(rideRequests).orderBy(desc(rideRequests.createdAt)).all();
    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt)
    }));
  },

  async deleteRideRequest(id: string) {
    const drizzle_db = drizzle(new Database(storage.dbPath));
    return await drizzle_db.delete(rideRequests).where(eq(rideRequests.id, id)).run();
  },

  async getUser(username: string) {
    const drizzle_db = drizzle(new Database(storage.dbPath));
    const users_result = await drizzle_db.select().from(users).where(eq(users.username, username)).all();
    return users_result[0];
  },

  async insertUser(user: { id: string; username: string; password: string }) {
    const drizzle_db = drizzle(new Database(storage.dbPath));
    return await drizzle_db.insert(users).values(user).run();
  }
};