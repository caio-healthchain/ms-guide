import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import { config } from './config';
import { logger } from './logger';

// PostgreSQL (Write) - Prisma Client
export const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['warn', 'error'],
});

// Cosmos DB MongoDB (Read) - Mongoose Connection
let mongooseConnection: typeof mongoose | null = null;

export async function connectDatabases(): Promise<void> {
  try {
    // Connect to PostgreSQL via Prisma
    await prisma.$connect();
    logger.info('✅ Connected to PostgreSQL (Write Database)');

    // Connect to Cosmos DB MongoDB (Read) if enabled
    if (config.features.useCosmosDB && config.cosmosdb.uri) {
      mongooseConnection = await mongoose.connect(config.cosmosdb.uri, config.cosmosdb.options);
      logger.info('✅ Connected to Cosmos DB MongoDB (Read Database)');
    }
  } catch (error) {
    logger.error('❌ Failed to connect to databases:', error);
    throw error;
  }
}

export async function disconnectDatabases(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Disconnected from PostgreSQL');

    if (mongooseConnection) {
      await mongoose.disconnect();
      logger.info('Disconnected from Cosmos DB MongoDB');
    }
  } catch (error) {
    logger.error('Error disconnecting from databases:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDatabases();
});

export { mongoose };
