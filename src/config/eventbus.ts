import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';
import { config } from './config';
import { logger } from './logger';

let serviceBusClient: ServiceBusClient | null = null;
const senders: Map<string, ServiceBusSender> = new Map();

export async function initializeEventBus(): Promise<void> {
  if (!config.eventBus.enabled || !config.eventBus.connectionString) {
    logger.info('Event Bus (Azure Service Bus) is disabled');
    return;
  }

  try {
    serviceBusClient = new ServiceBusClient(config.eventBus.connectionString);
    logger.info('✅ Event Bus (Azure Service Bus) initialized');
  } catch (error) {
    logger.error('❌ Failed to initialize Event Bus:', error);
    throw error;
  }
}

export async function publishEvent(queueName: string, message: any): Promise<void> {
  if (!serviceBusClient) {
    logger.warn('Event Bus not initialized, skipping event publication');
    return;
  }

  try {
    let sender = senders.get(queueName);
    
    if (!sender) {
      sender = serviceBusClient.createSender(queueName);
      senders.set(queueName, sender);
    }

    await sender.sendMessages({
      body: message,
      contentType: 'application/json',
    });

    logger.info(`Event published to queue: ${queueName}`, { message });
  } catch (error) {
    logger.error(`Failed to publish event to queue: ${queueName}`, error);
    throw error;
  }
}

export async function closeEventBus(): Promise<void> {
  if (!serviceBusClient) return;

  try {
    // Close all senders
    for (const [queueName, sender] of senders.entries()) {
      await sender.close();
      logger.info(`Closed sender for queue: ${queueName}`);
    }
    senders.clear();

    // Close the client
    await serviceBusClient.close();
    logger.info('Event Bus (Azure Service Bus) closed');
  } catch (error) {
    logger.error('Error closing Event Bus:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await closeEventBus();
});
