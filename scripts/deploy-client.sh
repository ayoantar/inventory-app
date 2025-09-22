#!/bin/bash

# LSVR Inventory - Client Deployment Script
# Usage: ./deploy-client.sh <client-name> [environment]

set -e  # Exit on any error

CLIENT_NAME=$1
ENVIRONMENT=${2:-production}

if [ -z "$CLIENT_NAME" ]; then
    echo "Error: Client name is required"
    echo "Usage: ./deploy-client.sh <client-name> [environment]"
    exit 1
fi

echo "🚀 Deploying LSVR Inventory for client: $CLIENT_NAME"
echo "📦 Environment: $ENVIRONMENT"

# Validate client configuration exists
CLIENT_ENV_FILE="./environments/${CLIENT_NAME}/.env.${ENVIRONMENT}"
CLIENT_COMPOSE_FILE="./environments/${CLIENT_NAME}/docker-compose.yml"

if [ ! -f "$CLIENT_ENV_FILE" ]; then
    echo "❌ Error: Environment file not found: $CLIENT_ENV_FILE"
    echo "Please create the environment file first using: ./setup-client.sh $CLIENT_NAME"
    exit 1
fi

# Create client directory if it doesn't exist
mkdir -p "./deployments/${CLIENT_NAME}"

# Copy environment file
cp "$CLIENT_ENV_FILE" "./deployments/${CLIENT_NAME}/.env"

# Copy or generate docker-compose file
if [ -f "$CLIENT_COMPOSE_FILE" ]; then
    cp "$CLIENT_COMPOSE_FILE" "./deployments/${CLIENT_NAME}/docker-compose.yml"
else
    # Generate from template
    envsubst < docker-compose.template.yml > "./deployments/${CLIENT_NAME}/docker-compose.yml"
fi

# Navigate to deployment directory
cd "./deployments/${CLIENT_NAME}"

# Load environment variables
export $(cat .env | grep -v ^# | xargs)

echo "🔧 Building Docker images..."
docker-compose build --no-cache

echo "🗄️  Setting up database..."
# Check if database exists and is accessible
if docker-compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "🔄 Starting database service..."
    docker-compose up -d db
    sleep 10  # Wait for database to be ready
fi

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose run --rm app npx prisma db push

# Seed initial data if requested
if [ "$SEED_DATA" = "true" ]; then
    echo "🌱 Seeding initial data..."
    docker-compose run --rm app npx prisma db seed
fi

echo "🚀 Starting services..."
docker-compose up -d

# Wait for application to be ready
echo "⏳ Waiting for application to start..."
sleep 15

# Health check
APP_URL="http://localhost:${APP_PORT:-3000}"
if curl -f "$APP_URL/api/health" > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo "🌐 Access your application at: $APP_URL"
else
    echo "⚠️  Application may not be ready yet. Check logs with:"
    echo "   docker-compose logs app"
fi

# Display useful information
echo ""
echo "📋 Deployment Summary:"
echo "   Client: $CLIENT_NAME"
echo "   Environment: $ENVIRONMENT"
echo "   Application URL: $APP_URL"
echo "   Database: PostgreSQL on port ${DB_PORT:-5432}"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Update: ./deploy-client.sh $CLIENT_NAME $ENVIRONMENT"
echo ""

cd - > /dev/null  # Return to original directory