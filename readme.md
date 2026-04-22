# Microservice Infrastructure

## 1 General information

Message queuing via RabbitMQ & containerization via Docker Compose, mandatory TLS & proxying via Traefik with a mandatory requirement of static IP containers in networks, Docker routing.

## 2 Architecture overview

The system consists of four containerized services:
- **Traefik**: Reverse proxy handling HTTPS/TLS termination and routing.
- **Producer**: Node.js/Fastify API that accepts HTTP requests and publishes messages to RabbitMQ.
- **Consumer**: Node.js background worker that consumes messages from RabbitMQ and logs them.
- **RabbitMQ**: Message broker with management UI.

All services run on a custom Docker network with static IP addresses (`192.168.100.0/24`).

## 3 Prerequisites

- Docker & Docker Compose
- Node.js v20+ (for local development)
- npm

## 4 Setup & Installation

### 4.1 Generate TLS Certificates
```bash
mkdir certs
cd certs
openssl req -x509 -newkey rsa:4096 -keyout localhost.key -out localhost.crt -days 365 -nodes -subj "/CN=producer.localhost"
```

### 4.2 Build and Run
```bash
docker compose up --build -d
```

## 5 Usage

### 5.1 Send a Message
```bash
curl -k -X POST https://producer.localhost/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, world!"}'
```
#### Expected response:
```json
{"status":"Message sent","message":{"message":"Hello, world!"}}
```
### 5.2 View Consumer Logs
```bash
docker logs -f consumer
```
### 5.3 Access Management UIs
- Traefik Dashboard: `http://localhost:8080`
- RabbitMQ Management: `http://localhost:15672` (guest/guest)

## 6 Testing the Requirements

| Requirement          | How It's Met                                                                    |
| :------------------- | :------------------------------------------------------------------------------ |
| **Message Queuing**  | RabbitMQ container with `tasks` queue.                                          |
| **Containerization** | Docker Compose orchestrates all services.                                       |
| **TLS**              | Traefik configured with self-signed certificate.                                |
| **Proxying**         | Traefik routes `producer.localhost` to Producer container.                      |
| **Static IPs**       | Custom network `microservice_net` with defined `ipv4_address` for each service. |
| **Docker Routing**   | Services communicate via container names (e.g., `rabbitmq:5672`).               |


## 7 Stopping the system

```bash
docker compose down
```