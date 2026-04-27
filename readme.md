# Microservice Infrastructure

Message queuing via RabbitMQ & containerisation via Docker Compose, mandatory TLS & proxying via Traefik with a mandatory requirement of static IP containers in networks, Docker routing.

## 1 Setup & Installation

```bash
git clone https://github.com/just-alish/microservice-lab.git
cd microservice-lab
docker compose up --build -d
```

## 2 Prerequisites

- Git Bash
- Docker & Docker Compose
- npm

## 3 Architecture overview

The system consists of four containerised services:
- **Traefik**: Reverse proxy handling HTTPS/TLS termination and routing.
- **Producer**: Node.js/Fastify API that accepts HTTP requests and publishes messages to RabbitMQ.
- **Consumer**: Node.js background worker that consumes messages from RabbitMQ and logs them.
- **RabbitMQ**: Message broker with management UI.

All services run on a custom Docker network with static IP addresses (`192.168.100.0/24`).

## 4 Usage

First, give RabbitMQ 5 seconds to boot, you may check the current status via:
```bash
watch docker ps
```
### 4.1 Send a Message
```bash
curl -k -X POST https://api.microservicelab.localhost/send -H "Content-Type: application/json" -d '{"task": "Complete the Docker lab", "priority": "high"}'
```
#### Expected response:
```json
{"status":"Message sent","message":{"message":"Hello, world!"}}
```
### 4.2 Check health
```bash
curl -k -X GET https://api.microservicelab.localhost/health
```
### 4.3 View Consumer Logs
```bash
docker logs -f consumer
```
### 4.4 Access Management UIs
- Traefik Dashboard: `http://localhost:8080`
- RabbitMQ Management: `http://localhost:15672` (guest/guest)

## 5 Testing the Requirements

| Requirement          | How It's Met                                                                    |
| :------------------- | :------------------------------------------------------------------------------ |
| **Message Queuing**  | RabbitMQ container with `tasks` queue.                                          |
| **Containerisation** | Docker Compose orchestrates all services.                                       |
| **TLS**              | Traefik configured with self-signed certificate.                                |
| **Proxying**         | Traefik routes `producer.localhost` to Producer container.                      |
| **Static IPs**       | Custom network `microservice_net` with defined `ipv4_address` for each service. |
| **Docker Routing**   | Services communicate via container names (e.g., `rabbitmq:5672`).               |

## 6 Stopping the system

```bash
docker compose down
```
