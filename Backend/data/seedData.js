require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('../config/db');
const Aadhaar = require('../models/Aadhaar');
const PollingStation = require('../models/PollingStation');

const mockAadhaarData = [
  {
    aadhaar: '123456789012',
    fullName: 'Ravi Kumar',
    dob: new Date('1995-08-15'),
    gender: 'Male',
    email: 'ravi.kumar@example.com',
    mobile: '9876543210',
    address: 'House No 123, Gandhi Nagar, Tirupati'
  },
  {
    aadhaar: '234567890123',
    fullName: 'Priya Sharma',
    dob: new Date('1998-03-22'),
    gender: 'Female',
    email: 'priya.sharma@example.com',
    mobile: '9876543211',
    address: 'Flat 45, MG Road, Bangalore'
  },
  {
    aadhaar: '345678901234',
    fullName: 'Amit Patel',
    dob: new Date('1990-11-10'),
    gender: 'Male',
    email: 'amit.patel@example.com',
    mobile: '9876543212',
    address: '78 Park Street, Ahmedabad'
  },
  {
    aadhaar: '456789012345',
    fullName: 'Sneha Reddy',
    dob: new Date('2000-07-05'),
    gender: 'Female',
    email: 'sneha.reddy@example.com',
    mobile: '9876543213',
    address: 'Villa 12, Banjara Hills, Hyderabad'
  },
  {
    aadhaar: '567890123456',
    fullName: 'Vikram Singh',
    dob: new Date('1992-01-18'),
    gender: 'Male',
    email: 'vikram.singh@example.com',
    mobile: '9876543214',
    address: '234 Mall Road, Jaipur'
  }
];

const mockPollingData = [
  {
    voterId: 'VOT123456',
    pollingStation: 'Tirupati Junior College',
    address: 'Near RTC Bus Stand, Tirupati, Andhra Pradesh',
    assembly: 'Tirupati',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    blo: {
      name: 'Ramesh Kumar',
      mobile: '9012345678'
    }
  },
  {
    voterId: 'VOT234567',
    pollingStation: 'Government High School',
    address: 'MG Road, Bangalore, Karnataka',
    assembly: 'Bangalore Central',
    district: 'Bangalore',
    state: 'Karnataka',
    blo: {
      name: 'Lakshmi Devi',
      mobile: '9012345679'
    }
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('\n🔄 Starting database seeding...\n');

    console.log('Clearing existing data...');
    await Aadhaar.deleteMany({});
    await PollingStation.deleteMany({});
    console.log('✓ Old data cleared\n');

    console.log('Inserting new data...');
    await Aadhaar.insertMany(mockAadhaarData);
    await PollingStation.insertMany(mockPollingData);
    console.log('✓ Database seeded successfully!');
    console.log(`✓ ${mockAadhaarData.length} Aadhaar records created`);
    console.log(`✓ ${mockPollingData.length} Polling station records created\n`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
