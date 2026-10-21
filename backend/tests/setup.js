const mongoose = require('mongoose');
const User = require('../models/User');
const HealthData = require('../models/HealthData');
const { generateToken } = require('../middleware/auth');

async function setupTestDb(dbName = 'pcos-pcod-app-test') {
  const uri = process.env.TEST_MONGODB_URI || `mongodb://127.0.0.1:27017/${dbName}`;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

async function cleanTestDb() {
  if (mongoose.connection.readyState !== 0) {
    const testUsers = await User.find({ email: { $regex: /test/i } });
    const testUserIds = testUsers.map(u => u._id);
    await HealthData.deleteMany({ user: { $in: testUserIds } });
    await User.deleteMany({ email: { $regex: /test/i } });
  }
}

async function closeTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = {
  setupTestDb,
  cleanTestDb,
  closeTestDb,
  generateToken
};
