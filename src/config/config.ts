import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3011', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API Key (for authentication)
  apiKey: process.env.API_KEY || 'your-api-key-here',
  
  // Azure PostgreSQL (Write Database)
  postgres: {
    connectionString: process.env.DATABASE_URL,
  },
  
  // Azure Cosmos DB (MongoDB API) - Read Database (CQRS)
  cosmosdb: {
    uri: process.env.COSMOSDB_URI || 'mongodb://localhost:27017/lazarus_read',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ssl: true,
      retryWrites: false, // Cosmos DB doesn't support retryWrites
    },
  },
  
  // Event Bus (Azure Service Bus) configuration
  eventBus: {
    connectionString: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING || process.env.SERVICE_BUS_CONNECTION_STRING || '',
    enabled: process.env.USE_SERVICE_BUS === 'true',
    queues: {
      guideCreated: 'guide.created',
      guideUpdated: 'guide.updated',
    }
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // Azure specific configurations
  azure: {
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
    resourceGroup: process.env.AZURE_RESOURCE_GROUP,
    location: process.env.AZURE_LOCATION || 'Brazil South',
    tenantId: process.env.AZURE_TENANT_ID,
  },
  
  // Feature flags
  features: {
    useCosmosDB: process.env.USE_COSMOSDB !== 'false', // Default to true
    useServiceBus: process.env.USE_SERVICE_BUS === 'true',
  },
};
