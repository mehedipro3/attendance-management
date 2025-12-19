const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://admin:admin123@db.ru3huqi.mongodb.net/?retryWrites=true&w=majority&appName=db';
const DB_NAME = 'sdp_app';

let client;
let db;

const connectDB = async () => {
  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
      console.log('Connected to MongoDB');
    }
    if (!db) {
      db = client.db(DB_NAME);
    }
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
};

const closeDB = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
};

module.exports = {
  connectDB,
  getDB,
  closeDB
};

