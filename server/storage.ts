import { type User, type InsertUser, type Registration, type InsertRegistration } from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getAllRegistrations(): Promise<Registration[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private registrations: Map<string, Registration>;
  private csvFilePath: string;

  constructor() {
    this.users = new Map();
    this.registrations = new Map();
    this.csvFilePath = path.join(process.cwd(), 'data', 'registrations.csv');
    
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.csvFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`Created data directory: ${dataDir}`);
      }

      // Create CSV file with headers if it doesn't exist, or load existing data
      if (!fs.existsSync(this.csvFilePath)) {
        this.initializeCsvFile();
        console.log(`CSV file initialized: ${this.csvFilePath}`);
      } else {
        console.log(`CSV file already exists: ${this.csvFilePath}`);
        this.loadDataFromCsv();
      }
    } catch (error) {
      console.error('Error initializing CSV storage:', error);
    }
  }

  private initializeCsvFile() {
    // Write CSV header
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
    
    fs.writeFileSync(this.csvFilePath, headers.join(',') + '\n');
  }

  private loadDataFromCsv() {
    try {
      const csvContent = fs.readFileSync(this.csvFilePath, 'utf-8');
      const lines = csvContent.trim().split('\n');
      
      // Skip header row
      if (lines.length <= 1) {
        console.log('CSV file has no data rows');
        return;
      }

      let loadedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        try {
          // Parse CSV row (handling quoted fields)
          const fields = this.parseCsvLine(line);
          
          if (fields.length >= 10) {
            const registration: Registration = {
              id: fields[0],
              ownerName: fields[1],
              ownerContact: fields[2],
              carModel: fields[3],
              regNumber: fields[4],
              seats: parseInt(fields[5]),
              cngPowered: fields[6] === 'Yes',
              driverName: fields[7],
              driverContact: fields[8],
              createdAt: new Date(fields[9])
            };
            
            this.registrations.set(registration.id, registration);
            loadedCount++;
          }
        } catch (rowError) {
          console.error(`Error parsing CSV row ${i}:`, rowError);
        }
      }
      
      console.log(`Loaded ${loadedCount} registrations from CSV file`);
    } catch (error) {
      console.error('Error loading data from CSV:', error);
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

  private appendToCsv(registration: Registration) {
    try {
      const csvRow = [
        registration.id,
        `"${registration.ownerName}"`,
        registration.ownerContact,
        `"${registration.carModel}"`,
        registration.regNumber,
        registration.seats,
        registration.cngPowered ? 'Yes' : 'No',
        `"${registration.driverName}"`,
        registration.driverContact,
        registration.createdAt.toISOString()
      ];
      
      fs.appendFileSync(this.csvFilePath, csvRow.join(',') + '\n');
      console.log(`Registration saved to CSV: ${registration.id}`);
    } catch (error) {
      console.error('Error saving to CSV:', error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const id = randomUUID();
    const registration: Registration = {
      ...insertRegistration,
      id,
      createdAt: new Date(),
    };
    this.registrations.set(id, registration);
    
    // Automatically save to CSV file
    this.appendToCsv(registration);
    
    return registration;
  }

  async getAllRegistrations(): Promise<Registration[]> {
    return Array.from(this.registrations.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
}

export const storage = new MemStorage();
