#!/bin/bash

# SGBlock Deployment Script
# This script handles deployment to production server

set -e

echo "🚀 Starting SGBlock deployment..."

# Configuration
DEPLOY_HOST="${DEPLOY_HOST:-your-server.com}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/sgblock}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-your-org/sgblock}"

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

# Check if required environment variables are set
check_env() {
    local required_vars=("DEPLOY_HOST" "DEPLOY_USER" "GITHUB_REPOSITORY")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Environment variable $var is not set"
            exit 1
        fi
    done
}

# Deploy via SSH
deploy_remote() {
    log_info "Connecting to $DEPLOY_HOST..."
    
    ssh -o StrictHostKeyChecking=no "$DEPLOY_USER@$DEPLOY_HOST" << EOF
        set -e
        
        echo "📁 Navigating to deployment directory..."
        cd $DEPLOY_PATH
        
        echo "🔄 Pulling latest Docker images..."
        docker-compose pull
        
        echo "🔄 Updating services..."
        docker-compose up -d
        
        echo "🧹 Cleaning up old images..."
        docker system prune -f
        
        echo "⏳ Waiting for services to start..."
        sleep 30
        
        echo "🔍 Running health checks..."
        if curl -f http://localhost:8080/health > /dev/null 2>&1; then
            echo "✅ Frontend health check passed"
        else
            echo "❌ Frontend health check failed"
            exit 1
        fi
        
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "✅ Backend health check passed"
        else
            echo "❌ Backend health check failed"
            exit 1
        fi
        
        echo "🎉 Deployment completed successfully!"
EOF
}

# Rollback function
rollback() {
    log_warn "Rolling back deployment..."
    
    ssh -o StrictHostKeyChecking=no "$DEPLOY_USER@$DEPLOY_HOST" << EOF
        set -e
        cd $DEPLOY_PATH
        
        echo "🔄 Rolling back to previous version..."
        docker-compose down
        docker-compose up -d
        
        echo "⏳ Waiting for services to start..."
        sleep 30
        
        echo "🔍 Running health checks..."
        curl -f http://localhost:8080/health
        curl -f http://localhost:3000/api/health
        
        echo "✅ Rollback completed"
EOF
}

# Main deployment process
main() {
    log_info "SGBlock Deployment Script v1.0"
    
    # Check environment
    check_env
    
    # Deploy
    if deploy_remote; then
        log_info "✅ Deployment successful!"
    else
        log_error "❌ Deployment failed!"
        
        read -p "Do you want to rollback? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback
        fi
        exit 1
    fi
}

# Run main function
main "$@"