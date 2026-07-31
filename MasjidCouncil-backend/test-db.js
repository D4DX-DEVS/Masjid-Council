require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
})
.then(() => {
    console.log('✅ MongoDB connection successful!');
    process.exit(0);
})
.catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
});