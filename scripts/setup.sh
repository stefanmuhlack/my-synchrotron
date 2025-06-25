#!/bin/bash

# SGBlock Setup Script
# This script sets up the development environment

set -e

echo "🔧 Setting up SGBlock development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install dependencies
install_dependencies() {
    log_info "Installing frontend dependencies..."
    npm ci
    
    if [ -d "backend" ]; then
        log_info "Installing backend dependencies..."
        cd backend
        npm ci
        cd ..
    fi
}

# Setup environment files
setup_env() {
    log_info "Setting up environment files..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.sample" ]; then
            cp .env.sample .env
            log_info "Created .env from .env.sample"
            log_warn "Please update .env with your actual configuration"
        else
            log_warn ".env.sample not found, skipping .env creation"
        fi
    else
        log_info ".env already exists"
    fi
    
    if [ -d "backend" ] && [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.sample" ]; then
            cp backend/.env.sample backend/.env
            log_info "Created backend/.env from backend/.env.sample"
        fi
    fi
}

# Setup Docker
setup_docker() {
    if command_exists docker && command_exists docker-compose; then
        log_info "Docker and Docker Compose are available"
        
        log_info "Building development containers..."
        docker-compose -f docker-compose.dev.yml build
        
        log_info "Starting development services..."
        docker-compose -f docker-compose.dev.yml up -d mongodb
        
        log_info "Waiting for MongoDB to be ready..."
        sleep 10
    else
        log_warn "Docker or Docker Compose not found, skipping Docker setup"
    fi
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Frontend tests
    npm run test
    
    # Backend tests (if backend exists)
    if [ -d "backend" ]; then
        cd backend
        npm test
        cd ..
    fi
}

# Main setup process
main() {
    log_info "SGBlock Setup Script v1.0"
    
    # Check Node.js
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        log_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    log_info "Node.js version: $(node --version)"
    log_info "npm version: $(npm --version)"
    
    # Install dependencies
    install_dependencies
    
    # Setup environment
    setup_env
    
    # Setup Docker (optional)
    setup_docker
    
    # Run tests
    if [ "$1" != "--skip-tests" ]; then
        run_tests
    fi
    
    log_info "✅ Setup completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Update .env files with your configuration"
    log_info "2. Start development server: npm run dev"
    log_info "3. Start backend (if applicable): cd backend && npm run dev"
    log_info "4. Or use Docker: docker-compose -f docker-compose.dev.yml up"
}

# Run main function
main "$@"