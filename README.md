# SGBlock Platform

A comprehensive coaching platform built with Vue 3 frontend and Node.js backend, featuring a modular architecture for extensible functionality.

## 🏗️ Architecture

- **Frontend**: Vue 3 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Module System**: Dynamic module loading with version compatibility
- **Authentication**: JWT-based with role-based access control
- **Deployment**: Docker + GitHub Actions CI/CD

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MongoDB (or use Docker)

### Development Setup

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd sgblock
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

2. **Configure environment**:
   ```bash
   cp .env.sample .env
   # Edit .env with your configuration
   ```

3. **Start development servers**:
   ```bash
   # Option 1: Using Docker (recommended)
   docker-compose -f docker-compose.dev.yml up
   
   # Option 2: Manual start
   npm run dev                    # Frontend (port 5173)
   cd backend && npm run dev      # Backend (port 3000)
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/api/health

## 🧪 Testing

```bash
# Run all tests
npm run test

# Specific test suites
npm run test:modules          # Module validation tests
npm run test:user-access      # User role access tests
npm run test:zip-validator    # ZIP validator tests
npm run test:login           # Login function tests

# Test with coverage
npm run test:coverage

# Backend tests
cd backend && npm test
```

## 📦 Module System

The platform features a dynamic module system with:

- **Hot reloading** in development
- **Version compatibility** checking
- **Role-based access** control
- **Widget system** for dashboard
- **ZIP upload** for module installation

### Available Modules

- **Goals**: Goal management and tracking
- **Tasks**: Task assignment and completion
- **SGNB**: Systematic Goal-oriented Needs-based Coaching
- **Checklists**: Process checklists and templates

### Creating Modules

1. Use the template in `src/templates/module-template/`
2. Copy to `src/modules/your-module-name/`
3. Update `module.config.ts` with your configuration
4. Implement views and components
5. Test with `npm run test:modules`

## 🔐 Authentication & Authorization

### User Roles

- **Admin**: Full system access, user management, module management
- **Coach**: Access to coaching modules, manage assigned coachees
- **Coachee**: Access to assigned modules, view own data

### Demo Credentials

- Admin: `admin@example.com` / `admin123`
- Coach: `coach1@example.com` / `coach123`
- Coachee: `coachee1@example.com` / `coachee123`

## 🚢 Deployment

### GitHub Actions CI/CD

The platform includes comprehensive CI/CD pipelines:

1. **Frontend Pipeline** (`.github/workflows/frontend.yml`):
   - Type checking with Vue TSC
   - Unit and integration tests
   - Build optimization
   - Docker image creation
   - Deployment to production

2. **Backend Pipeline** (`.github/workflows/backend.yml`):
   - Linting with ESLint
   - Unit and integration tests
   - MongoDB integration testing
   - Docker image creation
   - Deployment to production

3. **Full Stack Deployment** (`.github/workflows/deploy.yml`):
   - Coordinated deployment
   - Health checks
   - Slack notifications

### Required GitHub Secrets

```bash
# Deployment
DEPLOY_HOST=your-server.com
DEPLOY_USER=deploy
DEPLOY_SSH_KEY=<private-key>

# Database
MONGO_URI=mongodb://user:pass@host:port/db
JWT_SECRET=your-jwt-secret

# Notifications (optional)
SLACK_WEBHOOK=https://hooks.slack.com/...
```

### Manual Deployment

```bash
# Build and deploy
docker-compose pull
docker-compose up -d

# Or use deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 🔧 Configuration

### Environment Variables

See `.env.sample` for all available configuration options:

- **Database**: MongoDB connection and credentials
- **Authentication**: JWT secrets and expiration
- **CORS**: Allowed origins for cross-origin requests
- **Rate Limiting**: API rate limiting configuration
- **File Upload**: Module upload settings
- **Monitoring**: Logging and notification settings

### Docker Configuration

- `docker-compose.yml`: Production configuration
- `docker-compose.dev.yml`: Development configuration
- `Dockerfile.frontend`: Frontend container
- `backend/Dockerfile`: Backend container

## 📊 Monitoring & Health Checks

### Health Endpoints

- Frontend: `GET /health`
- Backend: `GET /api/health`

### Monitoring Features

- **Module Health Monitoring**: Real-time module status
- **Lifecycle Events**: Module load/unload tracking
- **Performance Metrics**: Response times and uptime
- **Error Tracking**: Comprehensive error logging

## 🛠️ Development

### Project Structure

```
sgblock/
├── src/                    # Frontend source
│   ├── components/         # Vue components
│   ├── modules/           # Dynamic modules
│   ├── core/              # Core functionality
│   ├── stores/            # Pinia stores
│   └── utils/             # Utilities
├── backend/               # Backend source
│   ├── src/               # TypeScript source
│   ├── models/            # MongoDB models
│   └── routes/            # API routes
├── test/                  # Test suites
├── scripts/               # Deployment scripts
└── .github/workflows/     # CI/CD pipelines
```

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Vitest**: Testing framework
- **Husky**: Git hooks (optional)

### Performance

- **Code Splitting**: Dynamic imports for modules
- **Lazy Loading**: Route-based code splitting
- **Caching**: Nginx caching for static assets
- **Compression**: Gzip compression
- **CDN Ready**: Optimized for CDN deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Use conventional commit messages
- Ensure module compatibility

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: Use GitHub Discussions for questions
- **Health Checks**: Monitor `/api/health` endpoint

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
  - Module system with hot reloading
  - Role-based access control
  - Dashboard widgets
  - CI/CD pipeline
  - Docker deployment

---

Built with ❤️ by the SGBlock Team