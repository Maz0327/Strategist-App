import { storage } from '../server/storage';

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');
  
  try {
    // Create admin user if not exists
    const adminEmail = 'admin@strategist.app';
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    
    if (!existingAdmin) {
      console.log('Creating admin user...');
      await storage.createUser({
        email: adminEmail,
        password: '$2b$12$hashed_password_here' // This should be properly hashed
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;