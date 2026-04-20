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
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('=== MONGODB ERROR START ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.error('=== MONGODB ERROR END ===');
    // Delay exit so logs flush
    setTimeout(() => process.exit(1), 2000);
  }
};

module.exports = connectDB;
