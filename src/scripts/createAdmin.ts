import { ConnectDB } from '@/config/db';
import UserModel from '@/app/models/userModel';

async function createAdminUser() {
  try {
    await ConnectDB();

    // Check if admin user already exists
    const existingAdmin = await UserModel.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = new UserModel({
      username: 'admin',
      password: 'admin123', // Change this to a secure password in production
    });

    await admin.save();
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser(); 