# Navigation System Guide

## Overview

The zen-rfp generator now includes a comprehensive, production-ready navigation system that ensures users always know where they are and can easily return home from any screen.

## Features Implemented

### ✅ Persistent Header Navigation
- **Global Header**: Appears on every page with consistent branding
- **Clickable Logo**: Returns to home/dashboard from anywhere
- **Active State Indicators**: Clear visual feedback for current page
- **Responsive Design**: Adapts to desktop, tablet, and mobile screens

### ✅ Mobile-Responsive Navigation
- **Desktop**: Full horizontal navigation with all items visible
- **Mobile**: Hamburger menu with slide-out drawer
- **Touch-Friendly**: Large tap targets for mobile devices
- **Smooth Animations**: Polished slide-in/out transitions

### ✅ Navigation Guard System
- **Unsaved Changes Protection**: Warns users before navigating away
- **Browser Back Button**: Intercepts and confirms when there are unsaved changes
- **Confirmation Dialog**: Clean UI for confirming navigation away from unsaved work

### ✅ Breadcrumb Navigation
- **Auto-Generated**: Based on current route
- **Clickable Segments**: Navigate to any level in the hierarchy
- **Home Icon**: Clear indicator of root level

### ✅ Error/404 Handling
- **Professional 404 Page**: Clear messaging and navigation options
- **Return Home Button**: Prominent CTA to get back on track
- **Go Back Button**: Browser history navigation

## Architecture

### Component Structure

```
src/components/Navigation/
├── NavigationProvider.tsx   # Context for navigation state
├── Header.tsx               # Main navigation header
├── Breadcrumbs.tsx         # Breadcrumb trail
├── MobileMenu.tsx          # Mobile slide-out menu
├── NavigationConfirmDialog.tsx  # Unsaved changes dialog
└── index.ts                # Barrel exports
```

### Navigation Context

The `NavigationProvider` wraps the entire app and provides:

- `currentPath`: Current route pathname
- `hasUnsavedChanges`: Flag for unsaved work
- `navigateWithGuard()`: Navigate with optional confirmation
- `confirmNavigation()`: Confirm pending navigation
- `cancelNavigation()`: Cancel pending navigation
- `goBack()`: Navigate to previous page

### Integration Points

1. **App.tsx**: Navigation provider wraps all routes
2. **Header**: Rendered at top level above route content
3. **Each Page**: Uses navigation context for state management

## Usage Examples

### Basic Navigation

```tsx
import { useNavigation } from '@/components/Navigation';

function MyComponent() {
  const { navigateWithGuard } = useNavigation();

  return (
    <button onClick={() => navigateWithGuard('/knowledge-base')}>
      Go to Knowledge Base
    </button>
  );
}
```

### With Unsaved Changes Protection

```tsx
import { useNavigation } from '@/components/Navigation';
import { useEffect } from 'react';

function FormComponent() {
  const { setHasUnsavedChanges } = useNavigation();
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  return (
    <form>
      {/* Your form fields */}
    </form>
  );
}
```

### Custom Breadcrumbs

```tsx
import { Breadcrumbs } from '@/components/Navigation';

function MyPage() {
  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Projects', path: '/projects' },
    { label: 'Current Project', path: '/projects/123' }
  ];

  return (
    <div>
      <Breadcrumbs items={breadcrumbItems} />
      {/* Page content */}
    </div>
  );
}
```

## Navigation Items Configuration

To add new navigation items, edit `src/components/Navigation/Header.tsx`:

```tsx
export const navigationItems: NavigationItem[] = [
  {
    label: 'Home',
    path: '/',
    icon: Home,
    description: 'Dashboard and project overview'
  },
  {
    label: 'Knowledge Base',
    path: '/knowledge-base',
    icon: FolderOpen,
    description: 'Manage company documents'
  },
  // Add your new items here
];
```

## Responsive Breakpoints

- **Mobile**: < 768px (md breakpoint)
  - Shows hamburger menu
  - Hide logo text on small screens
  - Full-width mobile menu drawer

- **Desktop**: ≥ 768px
  - Shows full horizontal navigation
  - All navigation items visible
  - Compact spacing

## Accessibility Features

### Keyboard Navigation
- **Tab**: Navigate through all interactive elements
- **Escape**: Close mobile menu
- **Enter/Space**: Activate buttons

### Screen Reader Support
- ARIA labels on all navigation elements
- Proper heading hierarchy
- Skip to main content link
- Current page indication with `aria-current`

### Focus Management
- Visible focus indicators
- Logical tab order
- Focus trap in mobile menu when open

## Styling

### Colors & Branding
- **Primary**: Uses app theme primary color
- **Active State**: Secondary background
- **Hover State**: Muted background
- **Logo**: Primary color with white text

### Animations
- **Mobile Menu**: 300ms ease-in-out slide
- **Hover States**: Smooth color transitions
- **Focus Indicators**: Immediate visual feedback

## Testing Checklist

Use this checklist to verify navigation works correctly:

- [x] Header appears on all pages
- [x] Logo navigates to home
- [x] Active page is highlighted
- [x] Mobile menu opens and closes smoothly
- [x] Navigation works from any page
- [x] 404 page shows correct navigation
- [x] Breadcrumbs show correct hierarchy
- [x] Unsaved changes warning displays
- [x] Browser back button works
- [x] Keyboard navigation functional
- [x] Screen reader announces navigation
- [x] Touch targets adequate on mobile

## User Flows

### Fresh User Landing
1. User arrives at app
2. Sees header with clear branding
3. Dashboard/home content below
4. Can navigate to any section via header

### Mid-Workflow
1. User is generating RFP response
2. Header remains visible
3. Can click logo or Home to return
4. Unsaved changes prompt if leaving early

### Lost/404 State
1. User hits invalid URL
2. 404 page displays with header
3. Clear "Return Home" button
4. Can also use header navigation

## Performance

- **Initial Load**: Navigation renders immediately
- **Route Changes**: No layout shift, smooth transitions
- **Mobile Menu**: Hardware-accelerated animations
- **No Blocking**: Navigation doesn't block content loading

## Future Enhancements

Potential improvements for future releases:

1. **Search Bar**: Global search in header
2. **User Menu**: Profile dropdown with settings
3. **Notifications**: Bell icon with alerts
4. **Recent Items**: Quick access to recent RFPs
5. **Theme Toggle**: Dark mode switch
6. **Keyboard Shortcuts**: Cmd+K for navigation

## Troubleshooting

### Navigation Not Showing
- Ensure `NavigationProvider` wraps your routes
- Check that `Header` is rendered in App.tsx
- Verify React Router is configured

### Unsaved Changes Not Working
- Make sure to call `setHasUnsavedChanges(true)` in your form
- Check that NavigationProvider is in the component tree
- Verify dialog component is imported

### Mobile Menu Not Opening
- Check z-index conflicts
- Ensure backdrop is not being covered
- Verify state management in MobileMenu

### Breadcrumbs Not Showing
- Check if route is in `routeBreadcrumbMap`
- Provide custom items via props if needed
- Verify Breadcrumbs component is rendered

## Support

For issues or questions:
- Check the CLAUDE.md file for project context
- Review component source code in `src/components/Navigation/`
- Contact: support@zenloop.com

---

**Last Updated**: 2025-01-05
**Version**: 2.0
