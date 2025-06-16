# Mentora

A modern full-stack application built with NestJS backend, PostgreSQL database, and LiveKit integration for real-time communication features.

## 🏗️ Architecture

Mentora is structured as a monorepo with the following components:

- **Backend**: NestJS TypeScript API with LiveKit integration
- **Frontend**: (Coming soon)
- **Contracts**: Shared types and interfaces
- **Database**: PostgreSQL with Docker support

## 🚀 Features

- RESTful API built with NestJS
- Real-time communication powered by LiveKit
- PostgreSQL database with health checks
- Docker containerization for easy development
- Hot reload development environment

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v22 or higher)
- [Yarn](https://yarnpkg.com/) package manager
- [Docker](https://www.docker.com/) and Docker Compose
- [Git](https://git-scm.com/)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone git@github.com:nachofq/mentora.git
   cd mentora
   ```

2. **Configure environment variables**

   Copy the example environment files and configure them:

   ```bash
   cp envs/env.backend.example envs/.env.backend
   cp envs/env.postgres.example envs/.env.postgres
   ```

   **Backend Environment (.env.backend):**

   ```env
   DATABASE_URL=postgresql://mentora-adm:mentora-adm-pwd@mentora:5432/mentora
   NODE_ENV=development
   LIVEKIT_URL=your_livekit_url_here
   LIVEKIT_API_KEY=your_livekit_api_key_here
   LIVEKIT_API_SECRET=your_livekit_api_secret_here
   ```

   **PostgreSQL Environment (.env.postgres):**

   ```env
   POSTGRES_USER=mentora-adm
   POSTGRES_PASSWORD=mentora-adm-pwd
   POSTGRES_DB=mentora
   ```

## 🏃‍♂️ Running the Application

### Development Mode

To start the application in development mode with hot reload and automatic rebuilding:

```bash
yarn start:dev:build
```

This command will:

- Build and start all Docker containers
- Set up PostgreSQL database with health checks
- Start the NestJS backend with debug mode enabled
- Enable hot reload for development

### Development Mode (without rebuild)

If containers are already built and you want to start them without rebuilding:

```bash
yarn start:dev
```

### Accessing the Application

Once running, you can access:

- **Backend API**: http://localhost:3000
- **Backend Debug Port**: localhost:10000 (for debugging)
- **PostgreSQL Database**: localhost:5442
  - Username: `mentora-adm`
  - Password: `mentora-adm-pwd`
  - Database: `mentora`

## 🧪 Testing

### API Testing with HTTP Client

The project includes an `api-client.http` file located in `apps/backend/api-client.http` that provides a convenient way to test your backend API endpoints directly from your IDE.

#### Prerequisites for API Testing

1. **Install REST Client Extension** (for VS Code):

   - Extension: [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

2. **Ensure the backend is running**:
   ```bash
   yarn start:dev:build
   ```

#### Available Test Endpoints

The api-client file includes the following test scenarios:

- **Health Check**: Verify that the backend server is running

  ```http
  GET http://localhost:3000/health
  ```

- **LiveKit Room Creation**: Test creating new LiveKit rooms

  ```http
  POST http://localhost:3000/livekit/create-room
  ```

- **LiveKit Token Generation**: Test LiveKit token creation
  ```http
  POST http://localhost:3000/livekit/create-token
  ```

#### How to Use the API Client

1. **Open the file**: Navigate to `apps/backend/api-client.http` in your IDE
2. **Run requests**: Click the "Send Request" button above each HTTP request (VS Code with REST Client extension)
3. **View responses**: Results will appear in a new panel showing status codes, headers, and response bodies
4. **Test different environments**: The file includes variables for development and production testing

#### Environment Variables in API Client

The file uses convenient variables:

- `@baseUrl = http://localhost:3000` - Development server URL
- `@contentType = application/json` - Standard content type
- `@devUrl` and `@prodUrl` - Environment-specific URLs

#### Example Usage

1. Start your development environment:

   ```bash
   yarn start:dev:build
   ```

2. Open `apps/backend/api-client.http` in VS Code
3. Click "Send Request" above the Health Check endpoint to verify your server is running
4. Test LiveKit endpoints to ensure proper integration
5. Modify requests as needed for your specific testing scenarios

This approach provides a simple, IDE-integrated way to test your API without needing external tools like Postman or curl commands.

## 🐳 Docker Services

The application uses Docker Compose with the following services:

- **postgres**: PostgreSQL 16 Alpine with health checks
- **backend**: NestJS application with debug support and volume mounting

## 📁 Project Structure

```
mentora/
├── apps/
│   ├── backend/          # NestJS backend application
│   ├── frontend/         # Frontend application (coming soon)
│   └── contracts/        # Shared types and interfaces
├── docker/
│   └── docker-compose.local.yml  # Docker Compose configuration
├── envs/
│   ├── env.backend.example       # Backend environment template
│   └── env.postgres.example      # PostgreSQL environment template
├── package.json          # Root package configuration
└── README.md
```
