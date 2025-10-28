# Reusable Table Components

This directory contains reusable table components that **exactly match** the doctors table implementation in the ProvidersPage. These components provide a consistent, flexible, and maintainable way to create data tables throughout the application.

## Components

### 1. DataTable
The main table component that combines all other table components with **exact styling** from the ProvidersPage.

**Features:**
- **Card-based rows** - Each row is a separate `div` with card styling (`#1f1f1f` background, `#2a2a2a` hover)
- **Individual table structure** - Each card contains its own `table` with `tbody` and `tr`
- **Status-based coloring** - Dynamic text colors based on status using `getStatusTextColor`
- **Sorting, searching, pagination** - Built-in functionality
- **Loading and empty states** - Consistent with ProvidersPage design
- **Row click handling** - Double-click to view details

### 2. TableHeader
Handles table header rendering with **exact styling** from ProvidersPage.

**Features:**
- **Exact sort indicators** - Same SVG arrows as ProvidersPage
- **Proper alignment** - Left/right/center alignment support
- **Hover effects** - Same transition colors as ProvidersPage
- **Width classes** - Same width distribution (`w-1/4`, `w-1/6`, etc.)

### 3. StatusColor
Provides **exact status-based text coloring** from ProvidersPage.

**Features:**
- **Same color logic** - Active (green status, white text), Inactive (red text), Suspended (amber text)
- **Case-insensitive handling** - Works with 'ACTIVE', 'active', etc.
- **Helper function** - `getStatusTextColor` for use in other components

### 4. TablePagination
Handles table pagination with **exact styling** from ProvidersPage.

**Features:**
- **Same background** - `#1a1a1a` background color
- **Same button styling** - Gray buttons with hover effects
- **Page range display** - Same logic as ProvidersPage
- **Items per page** - Optional selector

## Exact Implementation Match

The components are designed to **exactly replicate** the ProvidersPage table implementation:

### Card Structure
```tsx
// Each row is a card with exact styling
<div 
  className="rounded-lg p-2 transition-colors cursor-pointer group"
  style={{ backgroundColor: '#1f1f1f' }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = '#2a2a2a';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = '#1f1f1f';
  }}
>
  <table className="w-full">
    <tbody>
      <tr>
        <td className="px-0 py-0">
          {/* Content with status-based coloring */}
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Status Coloring
```tsx
// Exact same logic as ProvidersPage
const getTextColor = (status: string, isStatusField: boolean = false): string => {
  const normalizedStatus = status.toLowerCase();
  
  if (normalizedStatus === 'active') {
    return isStatusField ? 'text-green-500' : 'text-white';
  }
  
  if (normalizedStatus === 'red') {
    return 'text-red-500';
  }
  
  if (normalizedStatus === 'suspended') {
    return 'text-amber-500';
  }
  
  // For other statuses, try to use the status name as a CSS color
  const validColors = [
    'blue', 'purple', 'pink', 'indigo', 'cyan', 'teal', 'lime', 'yellow', 'orange', 'gray'
  ];
  
  if (validColors.includes(normalizedStatus)) {
    return `text-${normalizedStatus}-500`;
  }
  
  return 'text-white';
};
```

### Header Styling
```tsx
// Exact same header styling as ProvidersPage
<th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-1/4 cursor-pointer hover:text-gray-300 transition-colors">
  <div className="flex items-center gap-1">
    Doctor
    <svg className={`w-3 h-3 transition-colors ${sortField === 'name' ? 'text-gray-300' : 'text-gray-500'}`}>
      {/* Sort arrow */}
    </svg>
  </div>
</th>
```

## Usage Examples

### Basic DataTable (Exact ProvidersPage Style)

```tsx
import { DataTable, TableColumn, getStatusTextColor } from '@/components/tables';

const columns: TableColumn<Doctor>[] = [
  {
    key: 'name',
    label: 'Doctor',
    width: 'w-1/4',
    sortable: true,
    align: 'left',
    render: (value, doctor) => (
      <div 
        className={`font-semibold text-sm truncate text-left ${getStatusTextColor(doctor.status)}`}
        title={String(value)}
      >
        {String(value)}
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    width: 'w-20',
    sortable: true,
    align: 'left',
    render: (_, doctor) => (
      <span className={`text-xs font-medium text-left ${getStatusTextColor(doctor.status, true)}`}>
        {doctor.status === 'ACTIVE' ? 'Active' : doctor.status}
      </span>
    )
  }
];

function DoctorsTable({ doctors }: { doctors: Doctor[] }) {
  return (
    <DataTable
      data={doctors}
      columns={columns}
      statusField="status" // Required for status-based coloring
      onRowClick={(doctor) => console.log('Clicked:', doctor)}
      searchable={true}
      pagination={true}
    />
  );
}
```

### Complete ProvidersPage Replacement

```tsx
import { ProvidersPageExample } from '@/components/tables/examples/ProvidersPageExample';

// This component shows how to use the table components to create
// an exact replica of the ProvidersPage with doctors and hospitals tabs
function MyProvidersPage() {
  return <ProvidersPageExample />;
}
```

## Props Reference

### DataTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | - | Array of data items |
| `columns` | `TableColumn<T>[]` | - | Column definitions |
| `statusField` | `keyof T` | - | **Required** - Field containing status for coloring |
| `onRowClick` | `(item: T) => void` | - | Row click handler |
| `sortField` | `keyof T` | - | Current sort field |
| `sortDirection` | `'asc' \| 'desc'` | - | Sort direction |
| `onSort` | `(key: keyof T) => void` | - | Sort handler |
| `searchable` | `boolean` | `false` | Enable search |
| `pagination` | `boolean` | `true` | Enable pagination |
| `loading` | `boolean` | `false` | Loading state |
| `emptyMessage` | `string` | `'No data available'` | Empty state message |

### TableColumn Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `key` | `keyof T` | - | Data property key |
| `label` | `string` | - | Column header label |
| `width` | `string` | - | Column width class (e.g., `w-1/4`, `w-1/6`) |
| `sortable` | `boolean` | `false` | Enable sorting |
| `align` | `'left' \| 'right' \| 'center'` | `'left'` | Text alignment |
| `render` | `(value: any, item: T) => React.ReactNode` | - | Custom cell renderer |

## Styling (Exact Match)

The components use **exact same styling** as ProvidersPage:

- **Card Background**: `#1f1f1f` (normal), `#2a2a2a` (hover)
- **Header Background**: `#1a1a1a`
- **Pagination Background**: `#1a1a1a`
- **Text Colors**: Status-based using `getStatusTextColor`
- **Padding**: `px-0 py-0` for cells, `px-3 py-2` for headers
- **Borders**: None (card-based design)
- **Hover Effects**: Exact same transitions as ProvidersPage

## Migration from ProvidersPage

To replace the current ProvidersPage table implementation:

1. **Import the components**:
```tsx
import { DataTable, TableColumn, getStatusTextColor } from '@/components/tables';
```

2. **Define your columns** with the same structure as ProvidersPage:
```tsx
const columns: TableColumn<Doctor>[] = [
  // Same column definitions as ProvidersPage
];
```

3. **Use DataTable** instead of the custom table implementation:
```tsx
<DataTable
  data={doctors}
  columns={columns}
  statusField="status"
  onRowClick={handleDoctorClick}
  // ... other props
/>
```

The result will be **identical** to the current ProvidersPage implementation but with reusable, maintainable components.

## TypeScript Support

All components are fully typed with TypeScript generics:

```tsx
interface Doctor {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const columns: TableColumn<Doctor>[] = [
  // Column definitions
];

<DataTable<Doctor> data={doctors} columns={columns} statusField="status" />
```