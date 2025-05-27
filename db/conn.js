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

const client = new MongoClient(Db);

let _db;

module.exports = {
  async connectToServer() {
    try {
      console.log("Attempting to connect to MongoDB...");
      await client.connect();
      console.log("Successfully connected to MongoDB.");
      _db = client.db("foodBasket");
      return true;
    } catch (e) {
      console.error("Error connecting to MongoDB:", e);
      return false;
    }
  },
  getDb() {
    return _db;
  },
};
