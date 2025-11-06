import { NextResponse } from 'next/server';
import UserModel from '@/app/models/userModel';
import { ConnectDB } from '@/config/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    await ConnectDB();

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ username: 'admin' });
    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin user already exists' });
    }

    // Create admin user with plain password
    // The pre-save hook will handle the hashing
    const admin = new UserModel({
      username: 'admin',
      password: 'admin123'  // Plain password, will be hashed by pre-save hook
    });

    await admin.save();

    return NextResponse.json({ 
      message: 'Admin user created successfully'
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
} 