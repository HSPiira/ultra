# Comprehensive Nested Routing System

This document describes the comprehensive nested routing system implemented for the Ultra application, supporting multiple levels of tab navigation with URL synchronization.

## Overview

The routing system supports:
- **Main pages** with simple navigation
- **Detail pages** with tab navigation
- **Nested tabs** with sub-tab navigation
- **Deep nested tabs** with sub-sub-tab navigation
- **URL synchronization** for all navigation levels
- **Browser history** support (back/forward buttons)
- **Bookmarkable URLs** for any tab level
- **Validation and fallback** handling

## URL Structure

### Main Pages
- `/` - Dashboard
- `/companies` - Companies list
- `/schemes` - Schemes list
- `/medical-catalog` - Medical catalog
- `/members` - Members
- `/providers` - Providers
- `/claims` - Claims
- `/reports` - Reports
- `/analytics` - Analytics
- `/settings` - Settings

### Company Details (2 levels)
- `/companies/:id` - Company details (info tab)
- `/companies/:id/info` - Company info tab
- `/companies/:id/branches` - Company branches tab
- `/companies/:id/schemes` - Company schemes tab
- `/companies/:id/members` - Company members tab
- `/companies/:id/analytics` - Company analytics tab

### Scheme Details (4 levels)
- `/schemes/:id` - Scheme details (overview tab)
- `/schemes/:id/overview` - Scheme overview tab
- `/schemes/:id/assignments` - Scheme assignments tab (coverage group, plans type)
- `/schemes/:id/assignments/coverage` - Coverage group
- `/schemes/:id/assignments/coverage/plans` - Plans sub-tab
- `/schemes/:id/assignments/coverage/benefits` - Benefits sub-tab
- `/schemes/:id/assignments/medical` - Medical group
- `/schemes/:id/assignments/medical/hospitals` - Hospitals sub-tab
- `/schemes/:id/assignments/medical/services` - Services sub-tab
- `/schemes/:id/assignments/medical/labtests` - Lab tests sub-tab
- `/schemes/:id/assignments/medical/medicines` - Medicines sub-tab
- `/schemes/:id/members` - Scheme members tab
- `/schemes/:id/analytics` - Scheme analytics tab

### Medical Catalog (2 levels)
- `/medical-catalog` - Medical catalog (services tab)
- `/medical-catalog/services` - Services tab
- `/medical-catalog/medicines` - Medicines tab
- `/medical-catalog/labtests` - Lab tests tab
- `/medical-catalog/prices` - Hospital prices tab

## Implementation Details

### Router Configuration (`/router/index.tsx`)
```typescript
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // Main pages
      { index: true, element: <Dashboard /> },
      { path: 'companies', element: <CompaniesPage /> },
      
      // Company details with tabs
      { path: 'companies/:id', element: <CompanyDetailsPage /> },
      { path: 'companies/:id/:tab', element: <CompanyDetailsPage /> },
      
      // Scheme details with nested tabs
      { path: 'schemes', element: <SchemesPage /> },
      { path: 'schemes/:id', element: <SchemeDetailsPage /> },
      { path: 'schemes/:id/:tab', element: <SchemeDetailsPage /> },
      { path: 'schemes/:id/:tab/:subTab', element: <SchemeDetailsPage /> },
      { path: 'schemes/:id/:tab/:subTab/:subSubTab', element: <SchemeDetailsPage /> },
      
      // Medical catalog with tabs
      { path: 'medical-catalog', element: <MedicalCatalogPage /> },
      { path: 'medical-catalog/:tab', element: <MedicalCatalogPage /> },
      
      // Other pages...
    ]
  }
]);
```

### Route Configuration (`/router/routes.ts`)
The `routes.ts` file provides a centralized configuration for all routes with helper functions for:
- Route generation with parameters
- Tab validation
- Nested route building

### Component Integration

#### Detail Pages (e.g., SchemeDetailsPage)
```typescript
const { id, tab, subTab, subSubTab } = useParams<{ 
  id: string; 
  tab?: string; 
  subTab?: string; 
  subSubTab?: string; 
}>();

// Tab validation
const isValidTab = (tabName: string): tabName is SchemeDetailsTab => {
  return ['overview', 'assignments', 'members', 'analytics'].includes(tabName);
};

// Navigation handlers
const handleTabChange = (newTab: SchemeDetailsTab) => {
  setActiveTab(newTab);
  navigate(`/schemes/${id}/${newTab}`, { replace: true });
};

const handleSubTabChange = (newSubTab: string) => {
  if (activeTab === 'assignments') {
    navigate(`/schemes/${id}/assignments/${newSubTab}`, { replace: true });
  }
};
```

#### Nested Tab Components (e.g., SchemeAssignmentsTab)
```typescript
interface SchemeAssignmentsTabProps {
  scheme: Scheme;
  activeGroup?: GroupType;
  activeType?: ContentType;
  onGroupChange?: (group: GroupType) => void;
  onTypeChange?: (type: ContentType) => void;
}

// Sync with parent component
useEffect(() => {
  if (propActiveGroup && propActiveGroup !== activeGroup) {
    setActiveGroup(propActiveGroup);
  }
}, [propActiveGroup, activeGroup]);
```

## Features

### 1. URL Synchronization
- All tab changes update the URL immediately
- Browser back/forward buttons work correctly
- Direct URL access to any tab level

### 2. Validation and Fallback
- Invalid tabs redirect to default tabs
- Graceful error handling for malformed URLs
- Type-safe tab validation

### 3. Browser History
- Full browser navigation support
- Bookmarkable URLs for any tab level
- Shareable deep links

### 4. Consistent UX
- Same navigation pattern across all pages
- Predictable URL structure
- Professional user experience

## Usage Examples

### Navigating to a specific tab
```typescript
// Navigate to scheme assignments coverage plans
navigate('/schemes/123/assignments/coverage/plans');

// Navigate to medical catalog medicines
navigate('/medical-catalog/medicines');

// Navigate to company analytics
navigate('/companies/456/analytics');
```

### Programmatic tab changes
```typescript
// Change to assignments tab
handleTabChange('assignments');

// Change to coverage group
handleSubTabChange('coverage');

// Change to plans type
handleSubSubTabChange('plans');
```

## Benefits

1. **User Experience**: Users can bookmark and share specific tab views
2. **SEO Friendly**: Each tab has its own URL
3. **Browser Integration**: Full browser navigation support
4. **Developer Experience**: Consistent patterns across all pages
5. **Maintainability**: Centralized route configuration
6. **Type Safety**: TypeScript validation for all tab types
7. **Error Handling**: Graceful fallbacks for invalid URLs

## Future Enhancements

- Route-based code splitting for better performance
- Route guards for authentication/authorization
- Breadcrumb navigation based on URL structure
- Route-based analytics tracking
- Dynamic route generation from configuration

