// microservice-lab/producer/src/index.ts
import amqp from 'amqplib'
import Fastify from 'fastify'
// ## configuration
// ### RabbitMQ configuration
const PORT = 3000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const QUEUE_NAME = 'tasks';
// ### Fastify instantiating
const fastify = Fastify({
  logger: true
})
// ## RabbitMQ
let channel: amqp.Channel;

async function connectRabbitMQ(): Promise<void> {
  let retries = 5
  while (retries) {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });

      fastify.log.info(`Connected to RabbitMQ. Queue "${QUEUE_NAME}" ready.`);

      return; // god.

    } catch (error) {
      retries -= 1;
      fastify.log.error(error, `Failed to connect to RabbitMQ. Retries left: ${retries}`);
      if (retries === 0) {
        process.exit(1);
      }

      await new Promise(res => setTimeout(res, 5000));
    }
  }
}
// ## HTTP
// ### health check.
fastify.get('/health', async (request, reply) => {
  const isRabbitConnected = channel && channel.connection;
  
  if (!isRabbitConnected) {
    return reply.status(503).send({ 
      status: 'unhealthy', 
      reason: 'RabbitMQ connection lost' 
    });
  }

  return { status: 'ok', service: 'producer' };
});

fastify.post('/send', async (request, reply) => {
  const body = request.body;

  if (!body || typeof body !== 'object') {
    return reply.status(400).send({
      error: 'Bad Request',
      message: 'Request body must be a valid JSON object',
    });
  }

  try {
    const message = JSON.stringify(body);
    const buffer = Buffer.from(message);
        const sent = channel.sendToQueue(QUEUE_NAME, buffer, {
      persistent: true,
    });

    if (sent) {
      fastify.log.info(`Message published to "${QUEUE_NAME}": ${message}`);
      return reply.status(200).send({
        status: 'Message sent successfully',
        message: body,
      });
    } else/* if the queue is full: */{
      throw new Error('Message was not sent (write buffer full)');
    }
  } catch (error) {
    fastify.log.error(error, 'Failed to publish message:');
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to publish message to the queue',
    });
  }
});
// ## Start server
async function start(): Promise<void> {
  try {
    await connectRabbitMQ();
// ### Start HTTP server
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Producer server listening on port ${PORT}`);
  } catch (error) {
    fastify.log.error(error, 'Failed to start server:');
    process.exit(1);
  }
}

async function shutdown(): Promise<void> {
  fastify.log.info('Shutting down...');
  try {
    await fastify.close();
    /* RabbitMQ connection closes automatically when the channel is closed */
    process.exit(0);
  } catch (error) {
    fastify.log.error(error, 'Error during shutdown:');
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
// ## Entry point
start();