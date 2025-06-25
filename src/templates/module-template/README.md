# Template Module

This is a template module that demonstrates the standard structure and patterns for creating modules in the system.

## Overview

The Template Module provides a complete example of:
- Module configuration and setup
- CRUD operations with proper UI patterns
- Dashboard widget integration
- Role-based access control
- Responsive design and user experience
- Error handling and loading states

## Features

- **Item Management**: Create, read, update, and delete items
- **Status Tracking**: Track item status (active, pending, completed)
- **Dashboard Widget**: Shows recent items and statistics
- **Settings Panel**: Configure module preferences
- **Detail Views**: Comprehensive item detail pages
- **Search & Filtering**: Find items quickly
- **Activity Logging**: Track changes and updates

## File Structure

```
src/modules/template-module/
├── module.config.ts          # Module configuration
├── routes.ts                 # Route definitions
├── components/
│   └── Widget.vue           # Dashboard widget
├── views/
│   ├── MainView.vue         # Main module view
│   ├── SettingsView.vue     # Settings page
│   └── DetailView.vue       # Item detail view
└── README.md               # This file
```

## Configuration

The module is configured in `module.config.ts`:

```typescript
{
  name: 'Template Module',
  routePrefix: 'template-module',
  rolesAllowed: ['admin', 'coach', 'coachee'],
  hasWidget: true,
  version: '1.0.0',
  description: 'A template module demonstrating standard patterns'
}
```

## Routes

- `/template-module` - Main module view
- `/template-module/settings` - Settings (admin only)
- `/template-module/item/:id` - Item detail view

## Customization Guide

To create your own module based on this template: 

### 1. Copy the Template

```bash
cp -r src/templates/module-template/ src/modules/your-module-name/
```

### 2. Update Configuration

Edit `module.config.ts`:
- Change `name` to your module's display name
- Update `routePrefix` to a unique identifier
- Set appropriate `rolesAllowed`
- Update `description` and other metadata

### 3. Customize Routes

Edit `routes.ts`:
- Update route names to include your module name
- Modify paths as needed
- Set appropriate permissions

### 4. Update Views

Customize the view components:
- `MainView.vue` - Main functionality
- `SettingsView.vue` - Module settings
- `DetailView.vue` - Item details
- `Widget.vue` - Dashboard widget

### 5. Replace Mock Data

Replace all mock data with actual API calls:
- Update data fetching functions
- Implement proper error handling
- Add loading states

### 6. Test Your Module

- Restart the development server
- Check module appears in admin panel
- Test all routes and permissions
- Verify widget functionality

## API Integration

Replace the mock data with actual API calls:

```typescript
// Example API service
const loadItems = async () => {
  try {
    const response = await fetch('/api/your-module/items')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to load items:', error)
    throw error
  }
}
```

## State Management

For complex state, consider using Pinia:

```typescript
// stores/yourModule.ts
import { defineStore } from 'pinia'

export const useYourModuleStore = defineStore('yourModule', () => {
  const items = ref([])
  const loading = ref(false)
  
  const loadItems = async () => {
    loading.value = true
    try {
      // API call
    } finally {
      loading.value = false
    }
  }
  
  return { items, loading, loadItems }
})
```

## Styling Guidelines

- Use existing Tailwind CSS classes
- Follow the design system patterns
- Ensure responsive design
- Maintain accessibility standards
- Use consistent spacing and colors

## Testing

Test your module thoroughly:

1. **Functionality**: All CRUD operations work
2. **Permissions**: Role-based access is enforced
3. **Navigation**: All routes work correctly
4. **Widget**: Dashboard widget displays properly
5. **Responsive**: Works on all screen sizes
6. **Error Handling**: Graceful error states

## Common Patterns

### Data Fetching
```typescript
const loadData = async () => {
  try {
    loading.value = true
    const data = await api.getData()
    items.value = data
  } catch (error) {
    showError('Failed to load data')
  } finally {
    loading.value = false
  }
}
```

### Form Handling
```typescript
const saveItem = async () => {
  try {
    await api.saveItem(form.value)
    showSuccess('Item saved successfully')
    closeModal()
  } catch (error) {
    showError('Failed to save item')
  }
}
```

### Status Management
```typescript
const updateStatus = async (id: string, status: string) => {
  try {
    await api.updateStatus(id, status)
    // Update local state
    const item = items.value.find(i => i.id === id)
    if (item) item.status = status
  } catch (error) {
    showError('Failed to update status')
  }
}
```

## Troubleshooting

### Module Not Loading
- Check `module.config.ts` exports default object
- Verify all required fields are present
- Restart development server

### Routes Not Working
- Check route definitions in `routes.ts`
- Verify component imports
- Check authentication requirements

### Widget Not Showing
- Ensure `hasWidget` is true in config
- Check widget function is provided
- Verify user has required permissions

### Permission Issues
- Check `rolesAllowed` in config
- Verify route-level permissions
- Ensure user has correct role

## Support

For help with module development:
1. Check existing modules for examples
2. Review the main documentation
3. Run module validation tests
4. Contact the development team

## License

This template is part of the main application and follows the same license terms.