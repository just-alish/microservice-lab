import amqp from 'amqplib';
// ## Configuration
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const QUEUE_NAME = 'tasks';

async function start(): Promise<void> {
  try {
// ## RabbitMQ connection
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log(`Consumer connected. Waiting for messages in "${QUEUE_NAME}"...`);

    channel.consume(
      QUEUE_NAME,
      (msg) => {
        if (msg) {
          const content = msg.content.toString();
          console.log(`Received: ${content}`);
          
          channel.ack(msg);
          console.log('Message acknowledged.');
        }
      },
      { noAck: false } // Manual ACK
    );

    console.log('Consumer is listening...\n');
  } catch (error) {
    console.error('Failed to start consumer:', error);
    process.exit(1);
  }
}

async function shutdown(): Promise<void> {
  console.log('\nShutting down consumer...');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();