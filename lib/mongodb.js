import { MongoClient } from 'mongodb';

/**
 * Global MongoDB connection cache
 * This prevents creating multiple connections in development hot reloading
 */
const globalForMongo = global;

if (!globalForMongo._mongoClientPromise) {
  globalForMongo._mongoClientPromise = null;
  globalForMongo._mongoClient = null;
}

let cachedClient = globalForMongo._mongoClient;
let cachedDb = null;

/**
 * Singleton MongoDB connection
 * Returns cached connection or creates new one if needed
 */
export async function connectToDatabase() {
  // Return cached connection if available
  if (cachedDb && cachedClient) {
    return { client: cachedClient, db: cachedDb };
  }

  // Validate environment variables
  if (!process.env.MONGO_URL) {
    throw new Error('MONGO_URL is not defined in environment variables');
  }
  
  if (!process.env.DB_NAME) {
    throw new Error('DB_NAME is not defined in environment variables');
  }

  try {
    // Create new connection if cache is empty
    if (!globalForMongo._mongoClientPromise) {
      const options = {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      const client = new MongoClient(process.env.MONGO_URL, options);
      globalForMongo._mongoClientPromise = client.connect();
    }

    // Wait for connection
    cachedClient = await globalForMongo._mongoClientPromise;
    cachedDb = cachedClient.db(process.env.DB_NAME);

    // Update global cache
    globalForMongo._mongoClient = cachedClient;

    return { client: cachedClient, db: cachedDb };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Clear cache on error
    globalForMongo._mongoClientPromise = null;
    globalForMongo._mongoClient = null;
    cachedClient = null;
    cachedDb = null;
    throw error;
  }
}

/**
 * Get database instance (convenience method)
 */
export async function getDB() {
  const { db } = await connectToDatabase();
  return db;
}

/**
 * Check if database is connected
 */
export function isConnected() {
  return cachedClient !== null && cachedDb !== null;
}

/**
 * Close database connection (for cleanup)
 */
export async function closeConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    globalForMongo._mongoClientPromise = null;
    globalForMongo._mongoClient = null;
  }
}
