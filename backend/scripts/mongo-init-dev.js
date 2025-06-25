// MongoDB Development Initialization Script
// This script runs when the MongoDB container starts for the first time

print('🚀 Initializing MongoDB for SGBlock Development...');

// Switch to the development database
db = db.getSiblingDB('sgblock_dev');

// Create development user with read/write permissions
db.createUser({
  user: 'sgblock_dev_user',
  pwd: 'sgblock_dev_password',
  roles: [
    {
      role: 'readWrite',
      db: 'sgblock_dev'
    }
  ]
});

// Create collections with validation
print('📋 Creating collections with validation...');

// Users collection
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'name', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'must be a string with at least 6 characters'
        },
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 100,
          description: 'must be a string between 2 and 100 characters'
        },
        role: {
          enum: ['admin', 'coach', 'coachee'],
          description: 'must be one of admin, coach, or coachee'
        },
        mandant: {
          bsonType: 'string',
          description: 'must be a string'
        },
        isActive: {
          bsonType: 'bool',
          description: 'must be a boolean'
        }
      }
    }
  }
});

// Modules collection
db.createCollection('modules', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['key', 'name', 'routePrefix', 'rolesAllowed', 'hasWidget'],
      properties: {
        key: {
          bsonType: 'string',
          pattern: '^[a-z0-9-]+$',
          description: 'must be a string with lowercase letters, numbers, and hyphens only'
        },
        name: {
          bsonType: 'string',
          minLength: 1,
          description: 'must be a non-empty string'
        },
        routePrefix: {
          bsonType: 'string',
          minLength: 1,
          description: 'must be a non-empty string'
        },
        rolesAllowed: {
          bsonType: 'array',
          minItems: 1,
          items: {
            enum: ['admin', 'coach', 'coachee']
          },
          description: 'must be an array with at least one valid role'
        },
        hasWidget: {
          bsonType: 'bool',
          description: 'must be a boolean'
        },
        enabled: {
          bsonType: 'bool',
          description: 'must be a boolean'
        }
      }
    }
  }
});

// Goals collection
db.createCollection('goals', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'status', 'progress', 'userId'],
      properties: {
        title: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'must be a string between 1 and 200 characters'
        },
        status: {
          enum: ['not-started', 'in-progress', 'completed', 'on-hold'],
          description: 'must be a valid status'
        },
        progress: {
          bsonType: 'int',
          minimum: 0,
          maximum: 100,
          description: 'must be an integer between 0 and 100'
        },
        userId: {
          bsonType: 'objectId',
          description: 'must be a valid ObjectId'
        }
      }
    }
  }
});

// Tasks collection
db.createCollection('tasks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'status', 'priority', 'userId'],
      properties: {
        title: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'must be a string between 1 and 200 characters'
        },
        status: {
          enum: ['pending', 'in-progress', 'completed', 'overdue'],
          description: 'must be a valid status'
        },
        priority: {
          enum: ['low', 'medium', 'high'],
          description: 'must be a valid priority'
        },
        userId: {
          bsonType: 'objectId',
          description: 'must be a valid ObjectId'
        }
      }
    }
  }
});

// Create indexes for performance
print('🔍 Creating indexes...');

// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ mandant: 1 });
db.users.createIndex({ isActive: 1 });

// Modules indexes
db.modules.createIndex({ key: 1 }, { unique: true });
db.modules.createIndex({ enabled: 1 });
db.modules.createIndex({ rolesAllowed: 1 });

// Goals indexes
db.goals.createIndex({ userId: 1 });
db.goals.createIndex({ coachId: 1 });
db.goals.createIndex({ status: 1 });
db.goals.createIndex({ dueDate: 1 });
db.goals.createIndex({ createdAt: -1 });

// Tasks indexes
db.tasks.createIndex({ userId: 1 });
db.tasks.createIndex({ assignedBy: 1 });
db.tasks.createIndex({ goalId: 1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ priority: 1 });
db.tasks.createIndex({ dueDate: 1 });
db.tasks.createIndex({ createdAt: -1 });

print('✅ MongoDB development database initialized successfully!');
print('📊 Database: sgblock_dev');
print('👤 User: sgblock_dev_user');
print('🔐 Password: sgblock_dev_password');