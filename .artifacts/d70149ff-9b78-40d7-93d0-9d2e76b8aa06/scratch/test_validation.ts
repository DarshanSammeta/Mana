import { registerSchema } from '../../../src/validations/auth';
import { z } from 'zod';

const testCases = [
  {
    name: "Valid Customer Registration",
    payload: {
      fullName: "John Doe",
      email: "john@example.com",
      mobileNumber: "9876543210",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "CUSTOMER",
      referralCode: "REF123"
    },
    expectedSuccess: true
  },
  {
    name: "Invalid Email",
    payload: {
      fullName: "John Doe",
      email: "john-invalid",
      mobileNumber: "9876543210",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "CUSTOMER"
    },
    expectedSuccess: false
  },
  {
    name: "Password Mismatch",
    payload: {
      fullName: "John Doe",
      email: "john@example.com",
      mobileNumber: "9876543210",
      password: "Password123!",
      confirmPassword: "Password456!",
      role: "CUSTOMER"
    },
    expectedSuccess: false
  },
  {
    name: "Weak Password",
    payload: {
      fullName: "John Doe",
      email: "john@example.com",
      mobileNumber: "9876543210",
      password: "password",
      confirmPassword: "password",
      role: "CUSTOMER"
    },
    expectedSuccess: false
  },
  {
    name: "Valid Vendor Registration (No GST/PAN/Aadhaar)",
    payload: {
      fullName: "Jane Smith",
      email: "jane@business.com",
      mobileNumber: "9876543211",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "VENDOR",
      businessName: "Jane's Events",
      categoryId: "cat_123",
      experienceYears: 5,
      state: "Maharashtra",
      city: "Mumbai",
      address: "123 Business Park",
      pincode: "400001"
    },
    expectedSuccess: true
  },
  {
    name: "Vendor Missing Business Name",
    payload: {
      fullName: "Jane Smith",
      email: "jane@business.com",
      mobileNumber: "9876543211",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "VENDOR",
      categoryId: "cat_123",
      experienceYears: 5,
      state: "Maharashtra",
      city: "Mumbai",
      address: "123 Business Park",
      pincode: "400001"
    },
    expectedSuccess: false
  },
  {
    name: "Vendor Invalid Pincode",
    payload: {
      fullName: "Jane Smith",
      email: "jane@business.com",
      mobileNumber: "9876543211",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "VENDOR",
      businessName: "Jane's Events",
      categoryId: "cat_123",
      experienceYears: 5,
      state: "Maharashtra",
      city: "Mumbai",
      address: "123 Business Park",
      pincode: "40001"
    },
    expectedSuccess: false
  }
];

console.log("Running Zod Validation Tests...\n");

testCases.forEach((tc) => {
  try {
    registerSchema.parse(tc.payload);
    if (tc.expectedSuccess) {
      console.log(`[PASS] ${tc.name}`);
    } else {
      console.log(`[FAIL] ${tc.name} (Expected failure but succeeded)`);
    }
  } catch (error) {
    if (!tc.expectedSuccess) {
      console.log(`[PASS] ${tc.name} (Caught expected error: ${error.errors[0].message})`);
    } else {
      console.log(`[FAIL] ${tc.name} (Expected success but failed: ${error.message})`);
      console.log(JSON.stringify(error.errors, null, 2));
    }
  }
});
