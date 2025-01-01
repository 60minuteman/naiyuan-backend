const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('Attempting to connect to database...');
  console.log('Database URL:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'));

  try {
    // Test the connection
    await prisma.$connect();
    console.log('Successfully connected to database!');
    
    // Optional: Try a simple query
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Query test successful:', result);

  } catch (error) {
    console.log('Database connection failed!');
    console.log('Error type:', error.constructor.name);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

testConnection(); 