const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

const { MongoClient } = require("mongodb");

console.log("Environment variables loaded:", {
  ATLAS_URI: process.env.ATLAS_URI ? "exists" : "undefined",
  NODE_ENV: process.env.NODE_ENV,
  PWD: process.cwd(),
  ENV_PATH: path.resolve(__dirname, '../.env')
});

const Db = process.env.ATLAS_URI;
if (!Db) {
  console.error("MongoDB connection string is not defined in environment variables");
  process.exit(1);
}

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  // If the database connection is cached, use it instead of creating a new connection
  if (cachedDb) {
    return cachedDb;
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    const client = await MongoClient.connect(process.env.API_URI);
    console.log("Successfully connected to MongoDB.");
    
    const db = client.db("foodBasket");
    console.log("Connected to database: foodBasket");

    // Test the connection
    await db.command({ ping: 1 });
    console.log("Database connection test successful");

    // Cache the client and database connection
    cachedClient = client;
    cachedDb = db;

    return db;
  } catch (e) {
    console.error("Error connecting to MongoDB:", e);
    throw e;
  }
}

module.exports = {
  connectToDatabase,
  getDb: async function() {
    if (!cachedDb) {
      cachedDb = await connectToDatabase();
    }
    return cachedDb;
  }
};
