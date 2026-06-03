/**
 * Database Seed Script
 * 
 * Creates a default admin user and sample departments.
 * Run with: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // --- Seed Admin User ---
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      await User.create({
        username: 'admin',
        password: 'cse',    // Will be hashed by the pre-save hook
        role: 'admin'
      });
      console.log('✅ Default admin user created (username: admin, password: cse)');
    } else {
      console.log('ℹ️  Admin user already exists, skipping');
    }

    // --- Seed Departments ---
    const departments = [
      { name: 'Computer Science and Engineering', code: 'CSE' },
      { name: 'Information Technology', code: 'IT' },
      { name: 'Electronics and Communication Engineering', code: 'ECE' },
      { name: 'Electrical and Electronics Engineering', code: 'EEE' },
      { name: 'Mechanical Engineering', code: 'ME' },
      { name: 'Civil Engineering', code: 'CE' },
      { name: 'Artificial Intelligence and Machine Learning', code: 'AIML' },
      { name: 'Data Science', code: 'DS' }
    ];

    for (const dept of departments) {
      const existing = await Department.findOne({ code: dept.code });
      if (!existing) {
        await Department.create(dept);
        console.log(`✅ Department created: ${dept.name} (${dept.code})`);
      } else {
        console.log(`ℹ️  Department ${dept.code} already exists, skipping`);
      }
    }

    console.log('\n🎉 Seeding complete!');
    console.log('   Login with → username: admin | password: cse');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
};

seedData();
