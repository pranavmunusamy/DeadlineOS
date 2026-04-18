const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  console.log('Attempting MongoDB connection...');
  console.log('MONGODB_URI exists:', !!uri);
  console.log('URI prefix:', uri ? uri.substring(0, 20) + '...' : 'MISSING');

  if (!uri) {
    console.error('MONGODB_URI environment variable is not set!');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
