# Module Template

This directory contains templates and blueprints for creating new modules in the system.

## Quick Start

1. **Copy the template files** to your new module directory:
   ```bash
   cp -r src/templates/ src/modules/your-module-name/
   ```

2. **Customize the configuration** in `module.config.ts`:
   - Update the module name, route prefix, and roles
   - Set `hasDashboardWidget` based on your needs
   - Add version and compatibility information

3. **Update the routes** in `routes.ts`:
   - Define your module's routes
   - Set appropriate authentication and authorization

4. **Customize the views and components**:
   - Update `views/MainView.vue` with your module's functionality
   - If using a widget, customize `components/Widget.vue`

5. **Test your module**:
   - Restart the development server
   - Check that your module appears in the admin panel
   - Verify routes and permissions work correctly

## File Structure

```
src/modules/your-module/
├── module.config.ts          # Module configuration (required)
├── routes.ts                 # Route definitions (required)
├── components/
│   ├── Widget.vue           # Dashboard widget (if hasDashboardWidget is true)
│   └── ...                  # Other components
├── views/
│   ├── MainView.vue         # Main module view (required)
│   └── ...                  # Other views
├── stores/                  # Module-specific stores (optional)
├── utils/                   # Module-specific utilities (optional)
├── types/                   # Module-specific types (optional)
└── README.md               # Module documentation (recommended)
```

## Configuration Reference

### Required Fields

- **name**: Display name of the module
- **routePrefix**: URL prefix for module routes (no slashes)
- **rolesAllowed**: Array of user roles that can access this module
- **hasDashboardWidget**: Whether this module provides a dashboard widget
- **routes**: Function that returns the module's route definitions

### Optional Fields

- **widget**: Function that returns the dashboard widget component
- **version**: Semantic version of the module
- **compatibleWithCore**: Core version compatibility range
- **description**: Brief description of the module's functionality
- **author**: Module author/creator
- **icon**: Icon identifier for the module

## Best Practices

### Module Design

1. **Single Responsibility**: Each module should have a clear, focused purpose
2. **User-Centric**: Design around user workflows and tasks
3. **Consistent**: Follow existing UI patterns and conventions
4. **Accessible**: Ensure your module works for all users

### Code Quality

1. **TypeScript**: Use TypeScript for better type safety
2. **Error Handling**: Include proper error handling and user feedback
3. **Loading States**: Show loading indicators for async operations
4. **Responsive**: Ensure your module works on all screen sizes

### Performance

1. **Code Splitting**: Use dynamic imports for components
2. **Lazy Loading**: Load data only when needed
3. **Caching**: Cache data appropriately to reduce API calls
4. **Optimization**: Optimize for fast loading and smooth interactions

### Security

1. **Authentication**: Always require authentication for sensitive operations
2. **Authorization**: Use role-based access control appropriately
3. **Validation**: Validate all user inputs on both client and server
4. **Sanitization**: Sanitize data to prevent XSS attacks

## Testing

### Module Validation

Run the module test suite to validate your configuration:

```bash
npm run test:modules
```

This will check:
- Configuration validity
- Route definitions
- Widget functionality (if applicable)
- Version compatibility

### Manual Testing

1. **Admin Panel**: Check that your module appears in the module management
2. **Navigation**: Verify that navigation links work correctly
3. **Permissions**: Test with different user roles
4. **Functionality**: Test all features and edge cases

## Common Patterns

### Data Fetching

```typescript
// In your view component
const loadData = async () => {
  try {
    loading.value = true
    const response = await api.getData()
    data.value = response.data
  } catch (error) {
    console.error('Failed to load data:', error)
    // Show user-friendly error message
  } finally {
    loading.value = false
  }
}
```

### Form Handling

```typescript
// Form validation and submission
const saveItem = async () => {
  try {
    // Validate form data
    if (!form.value.title.trim()) {
      throw new Error('Title is required')
    }
    
    // Submit data
    await api.saveItem(form.value)
    
    // Show success message and close modal
    showSuccessMessage('Item saved successfully')
    closeModal()
    
  } catch (error) {
    showErrorMessage(error.message)
  }
}
```

### State Management

```typescript
// Use Pinia for complex state management
import { defineStore } from 'pinia'

export const useYourModuleStore = defineStore('yourModule', () => {
  const items = ref([])
  const loading = ref(false)
  
  const loadItems = async () => {
    loading.value = true
    try {
      const response = await api.getItems()
      items.value = response.data
    } finally {
      loading.value = false
    }
  }
  
  return { items, loading, loadItems }
})
```

## Troubleshooting

### Module Not Appearing

1. Check that `module.config.ts` exports a default object
2. Verify that all required fields are present
3. Ensure the module directory is in `src/modules/`
4. Restart the development server

### Routes Not Working

1. Check that `routes.ts` exports a default array
2. Verify route paths and component imports
3. Check authentication and authorization settings
4. Ensure route names are unique

### Widget Not Showing

1. Verify `hasDashboardWidget` is set to `true`
2. Check that the `widget` function is provided
3. Ensure the widget component exports correctly
4. Check user role permissions

### Permission Issues

1. Verify `rolesAllowed` includes the correct roles
2. Check route-level permissions in `meta`
3. Ensure the user has the required role
4. Check for typos in role names

## Support

For additional help:

1. Check the existing modules for examples
2. Review the main application documentation
3. Run the module validation tests
4. Contact the development team

## Examples

See the existing modules in `src/modules/` for real-world examples:

- `src/modules/goals/` - Simple CRUD module with widget
- `src/modules/tasks/` - Task management with status tracking
- `src/modules/sgnb/` - Complex module with multiple views
- `src/modules/adminpanel/` - Admin-only module with advanced features